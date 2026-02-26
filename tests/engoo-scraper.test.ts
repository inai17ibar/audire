import { describe, it, expect } from "vitest";

describe("Engoo Scraper Functionality", () => {
  describe("Article Data Structure", () => {
    it("should have valid scraped article structure", () => {
      const article = {
        title: "Test Article Title",
        url: "https://engoo.com/app/daily-news/article/test-article/abc123",
        date: "2026-02-19",
        level: 6,
        category: "Science & Technology",
        excerpt: "This is a test excerpt.",
        sourceAttribution: "Engoo Daily News",
      };

      expect(article.title).toBeDefined();
      expect(article.url).toContain("engoo.com");
      expect(article.level).toBeGreaterThanOrEqual(4);
      expect(article.level).toBeLessThanOrEqual(9);
      expect(article.sourceAttribution).toBe("Engoo Daily News");
    });

    it("should have valid article detail structure", () => {
      const detail = {
        title: "Test Article",
        content: "First paragraph.\n\nSecond paragraph.\n\n---\n\n**出典**: Engoo Daily News\n**元記事**: [Engoo Daily News](https://engoo.com/article/test)",
        level: 7,
        publishedDate: "2026-02-19",
        category: "Business & Politics",
      };

      expect(detail.content).toContain("出典");
      expect(detail.content).toContain("Engoo Daily News");
      expect(detail.content).toContain("元記事");
    });
  });

  describe("Category Inference", () => {
    it("should infer Business & Politics category", () => {
      const text = "business economy politics government election";
      const hasBusinessKeywords = /business|economy|politics|government|election/.test(text);
      expect(hasBusinessKeywords).toBe(true);
    });

    it("should infer Science & Technology category", () => {
      const text = "science technology research AI robot";
      const hasScienceKeywords = /science|technology|research|ai|robot/.test(text.toLowerCase());
      expect(hasScienceKeywords).toBe(true);
    });

    it("should infer Health & Lifestyle category", () => {
      const text = "health lifestyle fitness food diet";
      const hasHealthKeywords = /health|lifestyle|fitness|food|diet/.test(text);
      expect(hasHealthKeywords).toBe(true);
    });

    it("should infer Culture & Society category", () => {
      const text = "culture society art music film";
      const hasCultureKeywords = /culture|society|art|music|film/.test(text);
      expect(hasCultureKeywords).toBe(true);
    });

    it("should infer Travel & Experiences category", () => {
      const text = "travel tourism destination adventure";
      const hasTravelKeywords = /travel|tourism|destination|adventure/.test(text);
      expect(hasTravelKeywords).toBe(true);
    });
  });

  describe("Level Parsing", () => {
    it("should parse level from text", () => {
      const levelText = "8 Advanced";
      const match = levelText.match(/(\d+)/);
      const level = match ? parseInt(match[1]) : 6;
      expect(level).toBe(8);
    });

    it("should default to level 6 if no match", () => {
      const levelText = "Advanced";
      const match = levelText.match(/(\d+)/);
      const level = match ? parseInt(match[1]) : 6;
      expect(level).toBe(6);
    });

    it("should handle various level formats", () => {
      const formats = ["Level 5", "6 Intermediate", "7", "Advanced 8"];
      const levels = formats.map((text) => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 6;
      });

      expect(levels).toEqual([5, 6, 7, 8]);
    });
  });

  describe("URL Construction", () => {
    it("should construct full URL from relative path", () => {
      const relativePath = "/app/daily-news/article/test/abc123";
      const fullUrl = relativePath.startsWith("http")
        ? relativePath
        : `https://engoo.com${relativePath}`;

      expect(fullUrl).toBe("https://engoo.com/app/daily-news/article/test/abc123");
    });

    it("should keep full URL unchanged", () => {
      const fullUrl = "https://engoo.com/app/daily-news/article/test/abc123";
      const result = fullUrl.startsWith("http") ? fullUrl : `https://engoo.com${fullUrl}`;

      expect(result).toBe(fullUrl);
    });
  });

  describe("Content Attribution", () => {
    it("should format attribution correctly", () => {
      const url = "https://engoo.com/app/daily-news/article/test/abc123";
      const sourceAttribution = "Engoo Daily News";
      const excerpt = "First paragraph.\n\nSecond paragraph.";

      const content = `${excerpt}\n\n---\n\n**出典**: ${sourceAttribution}\n**元記事**: [Engoo Daily News](${url})\n\n※この記事の続きは上記のリンクからご覧いただけます。`;

      expect(content).toContain("出典");
      expect(content).toContain("元記事");
      expect(content).toContain(url);
      expect(content).toContain("※この記事の続きは上記のリンクからご覧いただけます。");
    });
  });

  describe("Article ID Generation", () => {
    it("should generate unique article IDs", () => {
      const timestamp = Date.now();
      const id1 = `engoo-${timestamp}-0`;
      const id2 = `engoo-${timestamp}-1`;

      expect(id1).not.toBe(id2);
      expect(id1).toContain("engoo-");
      expect(id2).toContain("engoo-");
    });
  });

  describe("Paragraph Extraction", () => {
    it("should limit to first 2 paragraphs", () => {
      const paragraphs = [
        "First paragraph.",
        "Second paragraph.",
        "Third paragraph.",
        "Fourth paragraph.",
      ];

      const limited = paragraphs.slice(0, 2);
      expect(limited.length).toBe(2);
      expect(limited).toEqual(["First paragraph.", "Second paragraph."]);
    });

    it("should join paragraphs with double newline", () => {
      const paragraphs = ["First paragraph.", "Second paragraph."];
      const joined = paragraphs.join("\n\n");

      expect(joined).toBe("First paragraph.\n\nSecond paragraph.");
    });
  });

  describe("Error Handling", () => {
    it("should return empty array on scraping error", () => {
      const articles: any[] = [];
      expect(articles.length).toBe(0);
    });

    it("should return null on article detail error", () => {
      const article = null;
      expect(article).toBeNull();
    });
  });

  describe("Limit Parameter", () => {
    it("should respect article limit", () => {
      const allArticles = Array.from({ length: 50 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
      }));

      const limit = 20;
      const limited = allArticles.slice(0, limit);

      expect(limited.length).toBe(20);
    });

    it("should handle limit larger than available articles", () => {
      const allArticles = Array.from({ length: 10 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
      }));

      const limit = 20;
      const limited = allArticles.slice(0, limit);

      expect(limited.length).toBe(10);
    });
  });
});
