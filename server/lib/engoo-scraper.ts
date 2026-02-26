import axios from "axios";
import * as cheerio from "cheerio";
import type { Article, ArticleCategory, ArticleLevel } from "../../types";

interface ScrapedArticle {
  title: string;
  url: string;
  date: string;
  level: ArticleLevel;
  category: ArticleCategory;
  excerpt: string;
  sourceAttribution: string;
}

/**
 * Scrape article metadata from Engoo Daily News
 * Only retrieves metadata and first paragraph to respect copyright
 */
export async function scrapeEngooArticles(limit: number = 20): Promise<ScrapedArticle[]> {
  try {
    console.log("[Engoo Scraper] Fetching articles from Engoo Daily News...");
    const response = await axios.get("https://engoo.com/app/daily-news", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    console.log("[Engoo Scraper] Page loaded, searching for articles...");
    console.log("[Engoo Scraper] Page HTML length:", response.data.length);
    console.log("[Engoo Scraper] Page title:", $("title").text());

    // Try multiple selector patterns to find articles
    const selectors = [
      "a[href*='/app/daily-news/article/']",
      "a[href*='/daily-news/article/']",
      "a[href*='/article/']",
      ".article-card a",
      ".news-card a",
      "[class*='article'] a[href*='article']",
      "[data-testid*='article'] a",
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`[Engoo Scraper] Trying selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        elements.each((_: number, element: any) => {
          if (articles.length >= limit) return false;

          const $el = $(element);
          const url = $el.attr("href");
          if (!url || !url.includes("article")) return;

          const fullUrl = url.startsWith("http") ? url : `https://engoo.com${url}`;
          
          // Try multiple ways to extract title
          let title = $el.find("h3, h4, h5, .title, [class*='title']").first().text().trim();
          if (!title) title = $el.text().trim();
          if (!title) title = $el.attr("title") || "";
          
          // Extract level from text (e.g., "8 Advanced" or "Level 8")
          const levelText = $el.find(".level, [class*='level'], [class*='difficulty']").text().trim();
          const levelMatch = levelText.match(/(\d+)/);
          let level: ArticleLevel = 6;
          if (levelMatch) {
            const parsedLevel = parseInt(levelMatch[1]);
            if (parsedLevel >= 1 && parsedLevel <= 10) {
              level = parsedLevel as ArticleLevel;
            }
          }

          // Extract date
          const dateText = $el.find(".date, [class*='date'], time").first().text().trim();
          const date = dateText || new Date().toISOString().split('T')[0];

          // Extract category from parent or nearby elements
          let category: ArticleCategory = "Science & Technology";
          const categoryText = $el.closest("[class*='category']").text().trim() || 
                              $el.find("[class*='category']").text().trim();
          category = inferCategoryFromText(categoryText) || category;
          
          if (title && url && title.length > 5) {
            // Avoid duplicate URLs
            if (!articles.some(a => a.url === fullUrl)) {
              articles.push({
                title,
                url: fullUrl,
                date,
                level,
                category,
                excerpt: "",
                sourceAttribution: "Engoo Daily News",
              });
              console.log(`[Engoo Scraper] Found article: "${title.substring(0, 50)}..."`);
            }
          }
        });

        if (articles.length > 0) {
          console.log(`[Engoo Scraper] Successfully found ${articles.length} articles using selector "${selector}"`);
          break; // Found articles, no need to try other selectors
        }
      }
    }

    if (articles.length === 0) {
      console.log("[Engoo Scraper] No articles found with any selector. Trying fallback strategy...");
      console.log("[Engoo Scraper] Total links on page:", $("a").length);
      
      // Fallback: Find all links and filter by URL pattern
      $("a").each((_: number, element: any) => {
        if (articles.length >= limit) return false;
        
        const $el = $(element);
        const url = $el.attr("href");
        if (!url || !url.includes("article")) return;
        
        const fullUrl = url.startsWith("http") ? url : `https://engoo.com${url}`;
        let title = $el.text().trim();
        
        if (title && url && title.length > 10 && title.length < 200) {
          if (!articles.some(a => a.url === fullUrl)) {
            articles.push({
              title,
              url: fullUrl,
              date: new Date().toISOString().split('T')[0],
              level: 6,
              category: "Science & Technology",
              excerpt: "",
              sourceAttribution: "Engoo Daily News",
            });
          }
        }
      });
      
      console.log(`[Engoo Scraper] Fallback strategy found ${articles.length} articles`);
    }

    console.log(`[Engoo Scraper] Total articles found: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error("[Engoo Scraper] Error scraping Engoo Daily News:", error);
    if (axios.isAxiosError(error)) {
      console.error("[Engoo Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return [];
  }
}

/**
 * Scrape detailed article content
 * Only retrieves first 2 paragraphs to respect copyright
 */
export async function scrapeArticleDetail(url: string): Promise<Partial<Article> | null> {
  try {
    console.log(`[Engoo Scraper] Fetching article detail from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract title - try multiple selectors
    let title = $("h1").first().text().trim();
    if (!title) title = $("[class*='title'] h1, [class*='article'] h1").first().text().trim();
    if (!title) title = $("article h1").first().text().trim();
    console.log(`[Engoo Scraper] Extracted title: "${title}"`);

    // Extract level
    const levelText = $("[class*='level'], [class*='difficulty']").text().trim();
    const levelMatch = levelText.match(/(\d+)/);
    let level: ArticleLevel = 6;
    if (levelMatch) {
      const parsedLevel = parseInt(levelMatch[1]);
      if (parsedLevel >= 1 && parsedLevel <= 10) {
        level = parsedLevel as ArticleLevel;
      }
    }
    console.log(`[Engoo Scraper] Extracted level: ${level}`);

    // Extract date
    const dateText = $("[class*='date'], time, [datetime]").first().text().trim();
    const publishedDate = dateText || new Date().toISOString().split('T')[0];
    console.log(`[Engoo Scraper] Extracted date: ${publishedDate}`);

    // Extract first 2 paragraphs only (to respect copyright)
    const paragraphs: string[] = [];
    const paragraphSelectors = [
      "article p",
      ".article-content p",
      "[class*='article'] p",
      "[class*='content'] p",
      "main p",
    ];

    for (const selector of paragraphSelectors) {
      $(selector).each((i: number, el: any) => {
        if (paragraphs.length < 2) {
          const text = $(el).text().trim();
          if (text && text.length > 20) { // Filter out very short paragraphs
            paragraphs.push(text);
          }
        }
      });
      
      if (paragraphs.length >= 2) break;
    }

    console.log(`[Engoo Scraper] Extracted ${paragraphs.length} paragraphs`);

    const excerpt = paragraphs.join("\n\n");

    // Extract source attribution
    let sourceAttribution = "Engoo Daily News";
    const attribution = $("[class*='attribution'], [class*='source'], [class*='credit']").text().trim();
    if (attribution) {
      sourceAttribution = attribution;
    }

    // Extract category
    const categoryText = $("[class*='category'], [class*='tag']").first().text().trim();
    const category = inferCategoryFromText(categoryText) || "Science & Technology";
    console.log(`[Engoo Scraper] Extracted category: ${category}`);

    // Create content with attribution
    const content = `${excerpt}\n\n---\n\n**出典**: ${sourceAttribution}\n**元記事**: [Engoo Daily News](${url})\n\n※この記事の続きは上記のリンクからご覧いただけます。`;

    return {
      title,
      content,
      level,
      publishedDate,
      category,
    };
  } catch (error) {
    console.error("[Engoo Scraper] Error scraping article detail:", error);
    if (axios.isAxiosError(error)) {
      console.error("[Engoo Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return null;
  }
}

/**
 * Infer category from text
 */
function inferCategoryFromText(text: string): ArticleCategory | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/business|economy|politics|government|election|trade|finance/)) {
    return "Business & Politics";
  }
  if (lowerText.match(/science|technology|research|study|ai|space|robot|innovation/)) {
    return "Science & Technology";
  }
  if (lowerText.match(/health|lifestyle|fitness|food|diet|wellness|medical/)) {
    return "Health & Lifestyle";
  }
  if (lowerText.match(/culture|society|art|music|film|book|social|entertainment/)) {
    return "Culture & Society";
  }
  if (lowerText.match(/travel|tourism|destination|adventure|hotel|vacation/)) {
    return "Travel & Experiences";
  }
  
  return null;
}
