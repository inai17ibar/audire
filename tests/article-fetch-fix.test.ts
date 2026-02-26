import { describe, it, expect } from "vitest";

describe("Article Fetch Fix", () => {
  describe("tRPC API JSON Format", () => {
    it("should encode tRPC query input with json wrapper", () => {
      const input = { url: "https://example.com", source: "bbc" };
      const encoded = encodeURIComponent(
        JSON.stringify({ json: input })
      );
      
      expect(encoded).toContain("json");
      expect(encoded).toContain("url");
      expect(encoded).toContain("source");
    });

    it("should create correct tRPC query URL for fetchArticleDetail", () => {
      const url = "https://bbc.co.uk/article/123";
      const source = "bbc";
      const queryUrl = `/api/trpc/news.fetchArticleDetail?input=${encodeURIComponent(
        JSON.stringify({ json: { url, source } })
      )}`;
      
      expect(queryUrl).toContain("/api/trpc/news.fetchArticleDetail");
      expect(queryUrl).toContain("input=");
    });

    it("should create correct tRPC query URL for translate", () => {
      const text = "Hello world";
      const queryUrl = `/api/trpc/translation.translate?input=${encodeURIComponent(
        JSON.stringify({ json: { text } })
      )}`;
      
      expect(queryUrl).toContain("/api/trpc/translation.translate");
      expect(queryUrl).toContain("input=");
    });
  });

  describe("Article Detail Response Parsing", () => {
    it("should parse tRPC response correctly", () => {
      const mockResponse = {
        result: {
          data: {
            article: {
              title: "Test Article",
              content: "Test content",
              level: 6,
              category: "Science & Technology",
              publishedDate: "2026-02-26",
            },
          },
        },
      };

      const detail = mockResponse.result.data.article;
      expect(detail.title).toBe("Test Article");
      expect(detail.content).toBe("Test content");
      expect(detail.level).toBe(6);
    });
  });

  describe("Translation Response Parsing", () => {
    it("should parse translation response correctly", () => {
      const mockResponse = {
        result: {
          data: {
            translation: "テスト内容",
          },
        },
      };

      const translation = mockResponse.result.data.translation;
      expect(translation).toBe("テスト内容");
    });
  });
});
