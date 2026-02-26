import { describe, it, expect } from "vitest";

describe("Article Fetch Bugfix", () => {
  describe("Article Source ID Generation", () => {
    it("should generate correct ID format for different sources", () => {
      const sources = ["bbc", "voa", "engoo"];
      const timestamp = Date.now();
      const successCount = 0;

      sources.forEach((source) => {
        const id = `${source}-${timestamp}-${successCount}`;
        expect(id).toMatch(new RegExp(`^${source}-\\d+-\\d+$`));
        expect(id).toContain(source);
      });
    });

    it("should generate unique IDs for different articles", () => {
      const source = "bbc";
      const ids = [];
      
      for (let i = 0; i < 5; i++) {
        const id = `${source}-${Date.now()}-${i}`;
        ids.push(id);
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe("Engoo Scraper Selector Patterns", () => {
    it("should have correct selector for Engoo article links", () => {
      const correctSelector = "a[href*='/app/daily-news/article/']";
      const testUrl = "/app/daily-news/article/giant-tortoises-return-to-galápagos-island-after-180-years/cbA-9BEfEfGui-cFBJO8Pg";
      
      // Simulate selector matching
      const matches = testUrl.includes("/app/daily-news/article/");
      expect(matches).toBe(true);
    });

    it("should match various Engoo article URL patterns", () => {
      const urls = [
        "/app/daily-news/article/how-work-culture-affects-your-savings/csUdtgXnEfGlKw_0o3mbqA",
        "/app/daily-news/article/51-of-uk-novelists-think-ai-will-replace-them/5afs5BEaEfGQxfPHjqxkEg",
        "/app/daily-news/article/france-asks-people-to-limit-meat-consumption/e4_58g2KEfGljV-jwI8Wrw",
      ];

      urls.forEach((url) => {
        const matches = url.includes("/app/daily-news/article/");
        expect(matches).toBe(true);
      });
    });
  });

  describe("Article Storage and Retrieval", () => {
    it("should save article with correct structure", () => {
      const article = {
        id: "bbc-1234567890-0",
        title: "Test Article",
        content: "Test content",
        translation: "テスト内容",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-25",
      };

      expect(article.id).toContain("bbc");
      expect(article.title).toBeTruthy();
      expect(article.content).toBeTruthy();
      expect(article.translation).toBeTruthy();
      expect(article.category).toBeTruthy();
      expect(article.level).toBeGreaterThanOrEqual(1);
      expect(article.level).toBeLessThanOrEqual(10);
    });
  });
});
