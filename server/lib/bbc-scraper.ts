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
 * Scrape article metadata from BBC Learning English
 */
export async function scrapeBBCArticles(limit: number = 20): Promise<ScrapedArticle[]> {
  try {
    console.log("[BBC Scraper] Fetching articles from BBC Learning English...");
    const response = await axios.get("https://www.bbc.co.uk/learningenglish/english/features/news-report", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    console.log("[BBC Scraper] Page loaded, searching for articles...");

    // Try multiple selector patterns
    const selectors = [
      ".widget-item a",
      ".promo a",
      "[class*='promo'] a",
      "[class*='item'] a[href*='/english/']",
      "a[href*='/learningenglish/']",
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`[BBC Scraper] Trying selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        elements.each((_: number, element: any) => {
          if (articles.length >= limit) return false;

          const $el = $(element);
          const url = $el.attr("href");
          if (!url) return;

          const fullUrl = url.startsWith("http") ? url : `https://www.bbc.co.uk${url}`;
          
          // Extract title
          let title = $el.find("h3, h4, .title, [class*='title']").first().text().trim();
          if (!title) title = $el.text().trim();
          if (!title) title = $el.attr("title") || "";
          
          // BBC Learning English is typically intermediate level
          const level: ArticleLevel = 6;

          // Extract date
          const dateText = $el.find(".date, time, [class*='date']").first().text().trim();
          const date = dateText || new Date().toISOString().split('T')[0];

          // Category based on URL or content
          let category: ArticleCategory = "Culture & Society";
          if (fullUrl.includes("news")) category = "Business & Politics";
          
          if (title && url && title.length > 5) {
            if (!articles.some(a => a.url === fullUrl)) {
              articles.push({
                title,
                url: fullUrl,
                date,
                level,
                category,
                excerpt: "",
                sourceAttribution: "BBC Learning English",
              });
              console.log(`[BBC Scraper] Found article: "${title.substring(0, 50)}..."`);
            }
          }
        });

        if (articles.length > 0) {
          console.log(`[BBC Scraper] Successfully found ${articles.length} articles`);
          break;
        }
      }
    }

    console.log(`[BBC Scraper] Total articles found: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error("[BBC Scraper] Error scraping BBC Learning English:", error);
    if (axios.isAxiosError(error)) {
      console.error("[BBC Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return [];
  }
}

/**
 * Scrape detailed article content from BBC Learning English
 */
export async function scrapeBBCArticleDetail(url: string): Promise<Partial<Article> | null> {
  try {
    console.log(`[BBC Scraper] Fetching article detail from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract title
    let title = $("h1").first().text().trim();
    if (!title) title = $("[class*='title'] h1").first().text().trim();
    console.log(`[BBC Scraper] Extracted title: "${title}"`);

    // BBC Learning English is intermediate level
    const level: ArticleLevel = 6;

    // Extract date
    const dateText = $("time, [class*='date'], [datetime]").first().text().trim();
    const publishedDate = dateText || new Date().toISOString().split('T')[0];
    console.log(`[BBC Scraper] Extracted date: ${publishedDate}`);

    // Extract first 2 paragraphs
    const paragraphs: string[] = [];
    const paragraphSelectors = [
      "article p",
      ".article-content p",
      "[class*='article'] p",
      "[class*='content'] p",
      "main p",
      ".text p",
    ];

    for (const selector of paragraphSelectors) {
      $(selector).each((i: number, el: any) => {
        if (paragraphs.length < 2) {
          const text = $(el).text().trim();
          if (text && text.length > 20) {
            paragraphs.push(text);
          }
        }
      });
      
      if (paragraphs.length >= 2) break;
    }

    console.log(`[BBC Scraper] Extracted ${paragraphs.length} paragraphs`);

    const excerpt = paragraphs.join("\n\n");

    const category: ArticleCategory = url.includes("news") ? "Business & Politics" : "Culture & Society";

    // Create content with attribution
    const content = `${excerpt}\n\n---\n\n**出典**: BBC Learning English\n**元記事**: [BBC Learning English](${url})\n\n※この記事の続きは上記のリンクからご覧いただけます。`;

    return {
      title,
      content,
      level,
      publishedDate,
      category,
    };
  } catch (error) {
    console.error("[BBC Scraper] Error scraping article detail:", error);
    if (axios.isAxiosError(error)) {
      console.error("[BBC Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return null;
  }
}
