/**
 * Cron job to fetch articles from BBC and VOA, translate them, and store in database.
 * This script runs periodically to keep the article database up-to-date.
 */

import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { scrapeBBCArticles } from "../lib/bbc-scraper";
import { scrapeVOAArticles } from "../lib/voa-scraper";
import { translateToJapanese } from "../lib/translator";
import { eq } from "drizzle-orm";

type NewsSource = "bbc" | "voa";

interface ArticleSummary {
  title: string;
  url: string;
  date: string;
  level: number;
  category: string;
  excerpt: string;
  sourceAttribution: string;
}

interface ArticleDetail {
  title: string;
  content: string;
  category: string;
  level: number;
  publishedDate: string;
  sourceUrl: string;
  sourceAttribution: string;
}

async function fetchArticlesFromSource(source: NewsSource, limit: number): Promise<ArticleSummary[]> {
  console.log(`[${source.toUpperCase()}] Fetching articles...`);
  
  if (source === "bbc") {
    return await scrapeBBCArticles(limit);
  } else if (source === "voa") {
    return await scrapeVOAArticles(limit);
  }
  
  return [];
}

async function fetchArticleDetail(url: string, source: NewsSource): Promise<ArticleDetail | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch article detail from ${url}`);
      return null;
    }
    
    const html = await response.text();
    const $ = (await import("cheerio")).load(html);
    
    let content = "";
    let title = "";
    let category = "";
    let level = 6;
    let publishedDate = new Date().toISOString().split("T")[0];
    
    if (source === "bbc") {
      title = $("h1").first().text().trim();
      content = $("article p").slice(0, 3).map((_, el) => $(el).text().trim()).get().join("\n\n");
      category = $(".category").first().text().trim() || "Business & Politics";
    } else if (source === "voa") {
      title = $("h1.title").first().text().trim();
      content = $(".wsw p").slice(0, 3).map((_, el) => $(el).text().trim()).get().join("\n\n");
      category = $(".category-link").first().text().trim() || "Business & Politics";
    }
    
    return {
      title,
      content,
      category,
      level,
      publishedDate,
      sourceUrl: url,
      sourceAttribution: source === "bbc" ? "BBC Learning English" : "VOA Learning English",
    };
  } catch (error) {
    console.error(`Error fetching article detail from ${url}:`, error);
    return null;
  }
}

async function processArticle(
  articleSummary: ArticleSummary,
  source: NewsSource
): Promise<void> {
  try {
    // Generate unique article ID
    const articleId = `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if article already exists
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      return;
    }
    
    const existing = await db.query.articles.findFirst({
      where: eq(articles.sourceUrl, articleSummary.url),
    });
    
    if (existing) {
      console.log(`Article already exists: ${articleSummary.title}`);
      return;
    }
    
    // Fetch article detail
    console.log(`Fetching detail for: ${articleSummary.title}`);
    const detail = await fetchArticleDetail(articleSummary.url, source);
    
    if (!detail || !detail.content) {
      console.error(`Failed to fetch detail for: ${articleSummary.title}`);
      return;
    }
    
    // Translate content to Japanese
    console.log(`Translating: ${articleSummary.title}`);
    let translation = "";
    try {
      translation = await translateToJapanese(detail.content);
    } catch (error) {
      console.error(`Translation failed for: ${articleSummary.title}`, error);
      // Continue without translation
    }
    
    // Save to database (db is already initialized above)
    await db.insert(articles).values({
      articleId,
      title: detail.title || articleSummary.title,
      content: detail.content,
      translation: translation || null,
      category: detail.category || articleSummary.category,
      level: detail.level || articleSummary.level,
      publishedDate: detail.publishedDate || articleSummary.date,
      source,
      sourceUrl: detail.sourceUrl || articleSummary.url,
      sourceAttribution: detail.sourceAttribution || articleSummary.sourceAttribution,
    });
    
    console.log(`✓ Saved: ${articleSummary.title}`);
  } catch (error) {
    console.error(`Error processing article: ${articleSummary.title}`, error);
  }
}

export async function fetchAndStoreArticles() {
  console.log("=== Starting article fetch job ===");
  const startTime = Date.now();
  
  try {
    // Fetch articles from both sources
    const bbcArticles = await fetchArticlesFromSource("bbc", 10);
    const voaArticles = await fetchArticlesFromSource("voa", 10);
    
    console.log(`Found ${bbcArticles.length} BBC articles and ${voaArticles.length} VOA articles`);
    
    // Process BBC articles
    for (const article of bbcArticles) {
      await processArticle(article, "bbc");
    }
    
    // Process VOA articles
    for (const article of voaArticles) {
      await processArticle(article, "voa");
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== Article fetch job completed in ${duration}s ===`);
  } catch (error) {
    console.error("Error in fetchAndStoreArticles:", error);
  }
}

// Run immediately if executed directly
if (require.main === module) {
  fetchAndStoreArticles()
    .then(() => {
      console.log("Job finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Job failed:", error);
      process.exit(1);
    });
}
