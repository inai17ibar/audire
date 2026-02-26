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
 * Scrape article metadata from VOA Learning English
 */
export async function scrapeVOAArticles(limit: number = 20): Promise<ScrapedArticle[]> {
  try {
    console.log("[VOA Scraper] Fetching articles from VOA Learning English...");
    const response = await axios.get("https://learningenglish.voanews.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    console.log("[VOA Scraper] Page loaded, searching for articles...");

    // Try multiple selector patterns
    const selectors = [
      ".media-block a",
      ".content-item a",
      "[class*='media'] a[href*='/a/']",
      "[class*='item'] a[href*='/a/']",
      "a[href*='learningenglish.voanews.com']",
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`[VOA Scraper] Trying selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        elements.each((_: number, element: any) => {
          if (articles.length >= limit) return false;

          const $el = $(element);
          const url = $el.attr("href");
          if (!url || url === "#") return;

          const fullUrl = url.startsWith("http") ? url : `https://learningenglish.voanews.com${url}`;
          
          // Extract title (prioritize img alt attribute)
          const $img = $el.find("img").first();
          let title = "";
          
          if ($img.length > 0) {
            // If link contains an image, use alt attribute
            title = $img.attr("alt") || "";
          }
          
          if (!title) {
            // Try to find title in nested headings
            title = $el.find("h3, h4, h5, .title, [class*='title']").first().text().trim();
          }
          
          if (!title) {
            // Use link text directly (excluding img tags)
            const $clone = $el.clone();
            $clone.find("img").remove();
            title = $clone.text().trim();
          }
          
          if (!title) title = $el.attr("title") || "";
          if (!title) title = $el.attr("aria-label") || "";
          
          // Determine level from URL or default to intermediate
          let level: ArticleLevel = 6;
          if (url.includes("beginning")) level = 3;
          else if (url.includes("intermediate")) level = 6;
          else if (url.includes("advanced")) level = 8;

          // Extract date
          const dateText = $el.find(".date, time, [class*='date']").first().text().trim();
          const date = dateText || new Date().toISOString().split('T')[0];

          // Category based on URL
          let category: ArticleCategory = "Culture & Society";
          if (url.includes("science") || url.includes("technology")) category = "Science & Technology";
          else if (url.includes("health")) category = "Health & Lifestyle";
          else if (url.includes("business") || url.includes("economy")) category = "Business & Politics";
          
          if (title && url && title.length > 5 && !url.includes("#")) {
            if (!articles.some(a => a.url === fullUrl)) {
              articles.push({
                title,
                url: fullUrl,
                date,
                level,
                category,
                excerpt: "",
                sourceAttribution: "VOA Learning English",
              });
              console.log(`[VOA Scraper] Found article: "${title.substring(0, 50)}..."`);
            }
          }
        });

        if (articles.length > 0) {
          console.log(`[VOA Scraper] Successfully found ${articles.length} articles`);
          break;
        }
      }
    }

    console.log(`[VOA Scraper] Total articles found: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error("[VOA Scraper] Error scraping VOA Learning English:", error);
    if (axios.isAxiosError(error)) {
      console.error("[VOA Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return [];
  }
}

/**
 * Scrape detailed article content from VOA Learning English
 */
export async function scrapeVOAArticleDetail(url: string): Promise<Partial<Article> | null> {
  try {
    console.log(`[VOA Scraper] Fetching article detail from: ${url}`);
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
    if (!title) title = $("[class*='title'] h1, .pg-title").first().text().trim();
    console.log(`[VOA Scraper] Extracted title: "${title}"`);

    // Determine level
    let level: ArticleLevel = 6;
    if (url.includes("beginning")) level = 3;
    else if (url.includes("intermediate")) level = 6;
    else if (url.includes("advanced")) level = 8;

    // Extract date
    const dateText = $("time, .published, [class*='date'], [datetime]").first().text().trim();
    const publishedDate = dateText || new Date().toISOString().split('T')[0];
    console.log(`[VOA Scraper] Extracted date: ${publishedDate}`);

    // Extract first 2 paragraphs
    const paragraphs: string[] = [];
    const paragraphSelectors = [
      ".wsw p",
      "article p",
      ".article-content p",
      "[class*='content'] p",
      ".body-container p",
      "main p",
    ];

    for (const selector of paragraphSelectors) {
      $(selector).each((i: number, el: any) => {
        if (paragraphs.length < 2) {
          const text = $(el).text().trim();
          if (text && text.length > 20 && !text.includes("Download")) {
            paragraphs.push(text);
          }
        }
      });
      
      if (paragraphs.length >= 2) break;
    }

    console.log(`[VOA Scraper] Extracted ${paragraphs.length} paragraphs`);

    const excerpt = paragraphs.join("\n\n");

    // Category based on URL
    let category: ArticleCategory = "Culture & Society";
    if (url.includes("science") || url.includes("technology")) category = "Science & Technology";
    else if (url.includes("health")) category = "Health & Lifestyle";
    else if (url.includes("business") || url.includes("economy")) category = "Business & Politics";

    // Create content with attribution
    const content = `${excerpt}\n\n---\n\n**出典**: VOA Learning English\n**元記事**: [VOA Learning English](${url})\n\n※この記事の続きは上記のリンクからご覧いただけます。`;

    return {
      title,
      content,
      level,
      publishedDate,
      category,
    };
  } catch (error) {
    console.error("[VOA Scraper] Error scraping article detail:", error);
    if (axios.isAxiosError(error)) {
      console.error("[VOA Scraper] Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    }
    return null;
  }
}
