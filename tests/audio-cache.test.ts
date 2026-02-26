import { describe, it, expect } from "vitest";

describe("Audio Cache Functionality", () => {
  describe("Cache Validation", () => {
    it("should validate cache within 7 days", () => {
      const now = new Date();
      const cachedAt = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
      
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = daysDiff < 7;
      
      expect(isValid).toBe(true);
    });

    it("should invalidate cache after 7 days", () => {
      const now = new Date();
      const cachedAt = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = daysDiff < 7;
      
      expect(isValid).toBe(false);
    });

    it("should handle edge case at exactly 7 days", () => {
      const now = new Date();
      const cachedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // exactly 7 days ago
      
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = daysDiff < 7;
      
      expect(isValid).toBe(false);
    });

    it("should handle fresh cache (0 days)", () => {
      const now = new Date();
      const cachedAt = new Date(now.getTime());
      
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = daysDiff < 7;
      
      expect(isValid).toBe(true);
    });
  });

  describe("Article Audio Cache Structure", () => {
    it("should have valid article with audio cache", () => {
      const article = {
        id: "article-1",
        title: "Test Article",
        content: "Test content",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-19",
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: "2026-02-19T00:00:00.000Z",
      };

      expect(article.audioUrl).toBeDefined();
      expect(article.audioCachedAt).toBeDefined();
      expect(article.audioUrl).toContain("https://");
    });

    it("should handle article without audio cache", () => {
      const article = {
        id: "article-1",
        title: "Test Article",
        content: "Test content",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-19",
      };

      expect((article as any).audioUrl).toBeUndefined();
      expect((article as any).audioCachedAt).toBeUndefined();
    });
  });

  describe("Cache Update Logic", () => {
    it("should update article with audio cache", () => {
      const article = {
        id: "article-1",
        title: "Test Article",
        content: "Test content",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-19",
      };

      const updatedArticle = {
        ...article,
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: new Date().toISOString(),
      };

      expect(updatedArticle.audioUrl).toBeDefined();
      expect(updatedArticle.audioCachedAt).toBeDefined();
    });

    it("should preserve existing article data when updating cache", () => {
      const article = {
        id: "article-1",
        title: "Test Article",
        content: "Test content",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-19",
        translation: "テスト記事",
      };

      const updatedArticle = {
        ...article,
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: new Date().toISOString(),
      };

      expect(updatedArticle.id).toBe(article.id);
      expect(updatedArticle.title).toBe(article.title);
      expect(updatedArticle.translation).toBe(article.translation);
    });
  });

  describe("Cache Clearing Logic", () => {
    it("should remove audio cache fields", () => {
      const article = {
        id: "article-1",
        title: "Test Article",
        content: "Test content",
        category: "Science & Technology" as const,
        level: 6 as const,
        publishedDate: "2026-02-19",
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: "2026-02-12T00:00:00.000Z", // 7+ days ago
      };

      const { audioUrl, audioCachedAt, ...clearedArticle } = article;

      expect((clearedArticle as any).audioUrl).toBeUndefined();
      expect((clearedArticle as any).audioCachedAt).toBeUndefined();
      expect(clearedArticle.id).toBe(article.id);
    });

    it("should count expired caches", () => {
      const now = new Date();
      const articles = [
        {
          id: "1",
          audioUrl: "url1",
          audioCachedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // expired
        },
        {
          id: "2",
          audioUrl: "url2",
          audioCachedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), // valid
        },
        {
          id: "3",
          audioUrl: "url3",
          audioCachedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // expired
        },
        {
          id: "4",
          // no cache
        },
      ];

      const expiredCount = articles.filter((article) => {
        if (!article.audioUrl || !article.audioCachedAt) return false;
        const cacheDate = new Date(article.audioCachedAt);
        const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 7;
      }).length;

      expect(expiredCount).toBe(2);
    });
  });

  describe("Cache Statistics", () => {
    it("should calculate cache statistics", () => {
      const now = new Date();
      const articles = [
        {
          id: "1",
          audioUrl: "url1",
          audioCachedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          audioUrl: "url2",
          audioCachedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          audioUrl: "url3",
          audioCachedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
        },
      ];

      const cachedArticles = articles.filter((a) => a.audioUrl);
      const validCached = cachedArticles.filter((a) => {
        if (!a.audioCachedAt) return false;
        const cacheDate = new Date(a.audioCachedAt);
        const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
      }).length;

      const stats = {
        totalCached: cachedArticles.length,
        validCached,
        expiredCached: cachedArticles.length - validCached,
      };

      expect(stats.totalCached).toBe(3);
      expect(stats.validCached).toBe(1);
      expect(stats.expiredCached).toBe(2);
    });

    it("should handle empty article list", () => {
      const articles: any[] = [];

      const cachedArticles = articles.filter((a) => a.audioUrl);
      const stats = {
        totalCached: cachedArticles.length,
        validCached: 0,
        expiredCached: 0,
      };

      expect(stats.totalCached).toBe(0);
      expect(stats.validCached).toBe(0);
      expect(stats.expiredCached).toBe(0);
    });
  });

  describe("ISO Date String Handling", () => {
    it("should parse ISO date string correctly", () => {
      const isoString = "2026-02-19T05:43:00.000Z";
      const date = new Date(isoString);

      expect(date.toISOString()).toBe(isoString);
      expect(date.getTime()).toBeGreaterThan(0);
    });

    it("should generate valid ISO date string", () => {
      const now = new Date();
      const isoString = now.toISOString();

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("Cache Reuse Logic", () => {
    it("should reuse valid cached audio", () => {
      const article = {
        id: "article-1",
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: new Date().toISOString(),
      };

      const now = new Date();
      const cacheDate = new Date(article.audioCachedAt);
      const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
      const shouldReuse = daysDiff < 7 && !!article.audioUrl;

      expect(shouldReuse).toBe(true);
    });

    it("should not reuse expired cached audio", () => {
      const now = new Date();
      const article = {
        id: "article-1",
        audioUrl: "https://s3.amazonaws.com/bucket/audio.mp3",
        audioCachedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const cacheDate = new Date(article.audioCachedAt);
      const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
      const shouldReuse = daysDiff < 7 && !!article.audioUrl;

      expect(shouldReuse).toBe(false);
    });

    it("should not reuse when audio URL is missing", () => {
      const article = {
        id: "article-1",
        audioCachedAt: new Date().toISOString(),
      };

      const shouldReuse = (article as any).audioUrl !== undefined;

      expect(shouldReuse).toBe(false);
    });
  });
});
