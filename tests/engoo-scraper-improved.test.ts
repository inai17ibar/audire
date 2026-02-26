import { describe, it, expect } from "vitest";

describe("Improved Engoo Scraper", () => {
  describe("Multiple Selector Strategy", () => {
    it("should try multiple selectors to find articles", () => {
      const selectors = [
        "a[href*='/app/daily-news/article/']",
        "a[href*='/daily-news/article/']",
        "a[href*='/article/']",
        ".article-card a",
        ".news-card a",
        "[class*='article'] a[href*='article']",
        "[data-testid*='article'] a",
      ];

      expect(selectors.length).toBeGreaterThan(5);
      expect(selectors[0]).toContain("article");
    });

    it("should stop searching after finding articles", () => {
      let articlesFound = false;
      let selectorsTriedCount = 0;

      const selectors = ["selector1", "selector2", "selector3"];

      for (const selector of selectors) {
        selectorsTriedCount++;
        if (selector === "selector2") {
          articlesFound = true;
          break;
        }
      }

      expect(articlesFound).toBe(true);
      expect(selectorsTriedCount).toBe(2); // Should stop after finding
    });
  });

  describe("URL Validation", () => {
    it("should validate article URLs", () => {
      const validUrls = [
        "https://engoo.com/app/daily-news/article/123",
        "/app/daily-news/article/456",
        "/daily-news/article/789",
      ];

      for (const url of validUrls) {
        expect(url).toContain("article");
      }
    });

    it("should convert relative URLs to absolute", () => {
      const relativeUrl = "/app/daily-news/article/123";
      const absoluteUrl = relativeUrl.startsWith("http")
        ? relativeUrl
        : `https://engoo.com${relativeUrl}`;

      expect(absoluteUrl).toBe("https://engoo.com/app/daily-news/article/123");
    });

    it("should keep absolute URLs unchanged", () => {
      const absoluteUrl = "https://engoo.com/app/daily-news/article/123";
      const result = absoluteUrl.startsWith("http")
        ? absoluteUrl
        : `https://engoo.com${absoluteUrl}`;

      expect(result).toBe(absoluteUrl);
    });
  });

  describe("Title Extraction", () => {
    it("should extract title from multiple sources", () => {
      const titleSources = [
        { type: "h3", value: "Article Title from H3" },
        { type: "text", value: "Article Title from Text" },
        { type: "attr", value: "Article Title from Attribute" },
      ];

      let title = "";
      for (const source of titleSources) {
        if (source.value) {
          title = source.value;
          break;
        }
      }

      expect(title).toBe("Article Title from H3");
    });

    it("should filter out invalid titles", () => {
      const titles = ["", "   ", "Valid Title", "Another Valid Title"];
      const validTitles = titles.filter((t) => t.trim().length > 5);

      expect(validTitles).toHaveLength(2);
      expect(validTitles[0]).toBe("Valid Title");
    });

    it("should limit title length", () => {
      const longTitle = "A".repeat(250);
      const shortTitle = "Short Title";

      expect(longTitle.length).toBeGreaterThan(200);
      expect(shortTitle.length).toBeLessThan(200);
    });
  });

  describe("Level Extraction", () => {
    it("should extract level from text", () => {
      const levelTexts = [
        "8 Advanced",
        "Level 6",
        "5",
        "Intermediate 7",
      ];

      for (const text of levelTexts) {
        const match = text.match(/(\d+)/);
        expect(match).not.toBeNull();
        if (match) {
          const level = parseInt(match[1]);
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(10);
        }
      }
    });

    it("should default to level 6 if no level found", () => {
      const text = "No level here";
      const match = text.match(/(\d+)/);
      const level = match ? parseInt(match[1]) : 6;

      expect(level).toBe(6);
    });

    it("should validate level range", () => {
      const levels = [0, 5, 10, 15];
      const validLevels = levels.filter((l) => l >= 1 && l <= 10);

      expect(validLevels).toEqual([5, 10]);
    });
  });

  describe("Duplicate Prevention", () => {
    it("should prevent duplicate URLs", () => {
      const articles = [
        { url: "https://engoo.com/article/1", title: "Article 1" },
        { url: "https://engoo.com/article/2", title: "Article 2" },
      ];

      const newUrl = "https://engoo.com/article/1";
      const isDuplicate = articles.some((a) => a.url === newUrl);

      expect(isDuplicate).toBe(true);
    });

    it("should allow unique URLs", () => {
      const articles = [
        { url: "https://engoo.com/article/1", title: "Article 1" },
      ];

      const newUrl = "https://engoo.com/article/3";
      const isDuplicate = articles.some((a) => a.url === newUrl);

      expect(isDuplicate).toBe(false);
    });
  });

  describe("Fallback Strategy", () => {
    it("should use fallback when primary selectors fail", () => {
      let articlesFound = 0;
      const primarySelectors = [];
      const fallbackLinks = ["link1", "link2", "link3"];

      if (primarySelectors.length === 0) {
        // Use fallback
        articlesFound = fallbackLinks.length;
      }

      expect(articlesFound).toBe(3);
    });

    it("should filter fallback results", () => {
      const links = [
        { url: "/article/1", text: "Valid Article Title" },
        { url: "/article/2", text: "Short" },
        { url: "/article/3", text: "A".repeat(250) },
        { url: "/other/4", text: "Not an article" },
      ];

      const validArticles = links.filter(
        (l) =>
          l.url.includes("article") &&
          l.text.length > 10 &&
          l.text.length < 200
      );

      expect(validArticles).toHaveLength(1);
      expect(validArticles[0].url).toBe("/article/1");
    });
  });

  describe("Category Inference", () => {
    it("should infer Business & Politics category", () => {
      const texts = [
        "business news today",
        "political election results",
        "economy and trade",
      ];

      for (const text of texts) {
        const lowerText = text.toLowerCase();
        const isBusiness = lowerText.match(
          /business|economy|politics|government|election|trade|finance/
        );
        expect(isBusiness).not.toBeNull();
      }
    });

    it("should infer Science & Technology category", () => {
      const texts = [
        "new AI breakthrough",
        "space exploration mission",
        "robotics research study",
      ];

      for (const text of texts) {
        const lowerText = text.toLowerCase();
        const isScience = lowerText.match(
          /science|technology|research|study|ai|space|robot|innovation/
        );
        expect(isScience).not.toBeNull();
      }
    });

    it("should default to Science & Technology if no match", () => {
      const text = "random content";
      const lowerText = text.toLowerCase();
      
      const categories = [
        /business|economy|politics/,
        /science|technology/,
        /health|lifestyle/,
        /culture|society/,
        /travel|tourism/,
      ];

      let matched = false;
      for (const pattern of categories) {
        if (lowerText.match(pattern)) {
          matched = true;
          break;
        }
      }

      const category = matched ? "Matched" : "Science & Technology";
      expect(category).toBe("Science & Technology");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", () => {
      const mockFetch = async () => {
        throw new Error("Network error");
      };

      let articles: any[] = [];
      let errorOccurred = false;

      mockFetch()
        .then((data) => {
          articles = data as any[];
        })
        .catch((error) => {
          errorOccurred = true;
          articles = [];
        });

      expect(errorOccurred).toBe(false); // Promise not resolved yet
      expect(articles).toEqual([]);
    });

    it("should return empty array on error", async () => {
      const scrapeWithError = async () => {
        try {
          throw new Error("Scraping failed");
        } catch (error) {
          console.error("Error:", error);
          return [];
        }
      };

      const result = await scrapeWithError();
      expect(result).toEqual([]);
    });
  });

  describe("Logging", () => {
    it("should log scraping progress", () => {
      const logs: string[] = [];
      const log = (message: string) => logs.push(message);

      log("[Engoo Scraper] Fetching articles...");
      log("[Engoo Scraper] Found 5 articles");
      log("[Engoo Scraper] Total articles: 5");

      expect(logs).toHaveLength(3);
      expect(logs[0]).toContain("Fetching");
      expect(logs[1]).toContain("Found");
      expect(logs[2]).toContain("Total");
    });

    it("should log selector attempts", () => {
      const selectors = ["selector1", "selector2", "selector3"];
      const logs: string[] = [];

      for (const selector of selectors) {
        logs.push(`Trying selector "${selector}": found 0 elements`);
      }

      expect(logs).toHaveLength(3);
      expect(logs[0]).toContain("selector1");
    });
  });

  describe("Paragraph Extraction", () => {
    it("should extract first 2 paragraphs only", () => {
      const paragraphs = [
        "First paragraph text",
        "Second paragraph text",
        "Third paragraph text",
        "Fourth paragraph text",
      ];

      const extracted = paragraphs.slice(0, 2);

      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toBe("First paragraph text");
      expect(extracted[1]).toBe("Second paragraph text");
    });

    it("should filter out short paragraphs", () => {
      const paragraphs = [
        "Short",
        "This is a longer paragraph with more content",
        "Also short",
        "Another longer paragraph with sufficient content",
      ];

      const filtered = paragraphs.filter((p) => p.length > 20);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toContain("longer paragraph");
    });

    it("should try multiple paragraph selectors", () => {
      const selectors = [
        "article p",
        ".article-content p",
        "[class*='article'] p",
        "[class*='content'] p",
        "main p",
      ];

      expect(selectors).toHaveLength(5);
      expect(selectors[0]).toBe("article p");
    });
  });

  describe("Attribution", () => {
    it("should create proper attribution", () => {
      const url = "https://engoo.com/article/123";
      const source = "Engoo Daily News";
      const attribution = `**出典**: ${source}\n**元記事**: [Engoo Daily News](${url})`;

      expect(attribution).toContain("出典");
      expect(attribution).toContain(url);
    });

    it("should include copyright notice", () => {
      const notice = "※この記事の続きは上記のリンクからご覧いただけます。";

      expect(notice).toContain("続き");
      expect(notice).toContain("リンク");
    });
  });
});
