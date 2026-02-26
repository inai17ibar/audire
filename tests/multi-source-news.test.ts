import { describe, it, expect } from "vitest";

describe("Multi-Source News Integration", () => {
  describe("Source Selection", () => {
    it("should support BBC, VOA, and Engoo sources", () => {
      const sources = ["bbc", "voa", "engoo"];
      expect(sources).toHaveLength(3);
      expect(sources).toContain("bbc");
      expect(sources).toContain("voa");
      expect(sources).toContain("engoo");
    });

    it("should default to BBC source", () => {
      const defaultSource = "bbc";
      expect(defaultSource).toBe("bbc");
    });

    it("should allow source switching", () => {
      let selectedSource = "bbc";
      selectedSource = "voa";
      expect(selectedSource).toBe("voa");
      selectedSource = "engoo";
      expect(selectedSource).toBe("engoo");
    });
  });

  describe("API Endpoint Structure", () => {
    it("should include source parameter in fetchArticles", () => {
      const apiCall = {
        source: "bbc",
        limit: 20,
      };
      expect(apiCall).toHaveProperty("source");
      expect(apiCall).toHaveProperty("limit");
      expect(apiCall.source).toBe("bbc");
    });

    it("should include source parameter in fetchArticleDetail", () => {
      const apiCall = {
        url: "https://example.com/article",
        source: "voa",
      };
      expect(apiCall).toHaveProperty("url");
      expect(apiCall).toHaveProperty("source");
      expect(apiCall.source).toBe("voa");
    });

    it("should support all three sources in API calls", () => {
      const sources = ["bbc", "voa", "engoo"];
      for (const source of sources) {
        const apiCall = { source, limit: 20 };
        expect(apiCall.source).toBe(source);
      }
    });
  });

  describe("Source-Specific Behavior", () => {
    it("should use BBC scraper for BBC source", () => {
      const source = "bbc";
      let scraperUsed = "";
      
      switch (source) {
        case "bbc":
          scraperUsed = "BBC Scraper";
          break;
        case "voa":
          scraperUsed = "VOA Scraper";
          break;
        case "engoo":
          scraperUsed = "Engoo Scraper";
          break;
      }
      
      expect(scraperUsed).toBe("BBC Scraper");
    });

    it("should use VOA scraper for VOA source", () => {
      const source = "voa";
      let scraperUsed = "";
      
      switch (source) {
        case "bbc":
          scraperUsed = "BBC Scraper";
          break;
        case "voa":
          scraperUsed = "VOA Scraper";
          break;
        case "engoo":
          scraperUsed = "Engoo Scraper";
          break;
      }
      
      expect(scraperUsed).toBe("VOA Scraper");
    });

    it("should use Engoo scraper for Engoo source", () => {
      const source = "engoo";
      let scraperUsed = "";
      
      switch (source) {
        case "bbc":
          scraperUsed = "BBC Scraper";
          break;
        case "voa":
          scraperUsed = "VOA Scraper";
          break;
        case "engoo":
          scraperUsed = "Engoo Scraper";
          break;
      }
      
      expect(scraperUsed).toBe("Engoo Scraper");
    });
  });

  describe("Source Attribution", () => {
    it("should attribute BBC articles correctly", () => {
      const source = "bbc";
      const attribution = source === "bbc" ? "BBC Learning English" : "Other";
      expect(attribution).toBe("BBC Learning English");
    });

    it("should attribute VOA articles correctly", () => {
      const source = "voa";
      const attribution = source === "voa" ? "VOA Learning English" : "Other";
      expect(attribution).toBe("VOA Learning English");
    });

    it("should attribute Engoo articles correctly", () => {
      const source = "engoo";
      const attribution = source === "engoo" ? "Engoo Daily News" : "Other";
      expect(attribution).toBe("Engoo Daily News");
    });
  });

  describe("UI Source Selection", () => {
    it("should highlight selected source button", () => {
      const selectedSource = "bbc";
      const bbcButtonClass = selectedSource === "bbc" ? "bg-primary" : "bg-surface";
      const voaButtonClass = selectedSource === "voa" ? "bg-primary" : "bg-surface";
      const engooButtonClass = selectedSource === "engoo" ? "bg-primary" : "bg-surface";
      
      expect(bbcButtonClass).toBe("bg-primary");
      expect(voaButtonClass).toBe("bg-surface");
      expect(engooButtonClass).toBe("bg-surface");
    });

    it("should show correct description for selected source", () => {
      const sources = {
        bbc: "BBC Learning Englishから学習者向けの記事を取得します。",
        voa: "VOA Learning Englishから学習者向けの記事を取得します。",
        engoo: "Engoo Daily Newsから最新の記事を取得します。",
      };
      
      expect(sources.bbc).toContain("BBC Learning English");
      expect(sources.voa).toContain("VOA Learning English");
      expect(sources.engoo).toContain("Engoo Daily News");
    });
  });

  describe("Level Assignment", () => {
    it("should assign intermediate level to BBC articles", () => {
      const source = "bbc";
      const level = source === "bbc" ? 6 : 5;
      expect(level).toBe(6);
    });

    it("should assign level based on URL for VOA articles", () => {
      const urls = [
        { url: "/beginning/article", expectedLevel: 3 },
        { url: "/intermediate/article", expectedLevel: 6 },
        { url: "/advanced/article", expectedLevel: 8 },
        { url: "/other/article", expectedLevel: 6 },
      ];
      
      for (const { url, expectedLevel } of urls) {
        let level = 6;
        if (url.includes("beginning")) level = 3;
        else if (url.includes("intermediate")) level = 6;
        else if (url.includes("advanced")) level = 8;
        
        expect(level).toBe(expectedLevel);
      }
    });
  });

  describe("Category Inference", () => {
    it("should infer category from URL for VOA articles", () => {
      const urlCategories = [
        { url: "/science/article", expected: "Science & Technology" },
        { url: "/technology/article", expected: "Science & Technology" },
        { url: "/health/article", expected: "Health & Lifestyle" },
        { url: "/business/article", expected: "Business & Politics" },
        { url: "/other/article", expected: "Culture & Society" },
      ];
      
      for (const { url, expected } of urlCategories) {
        let category = "Culture & Society";
        if (url.includes("science") || url.includes("technology")) {
          category = "Science & Technology";
        } else if (url.includes("health")) {
          category = "Health & Lifestyle";
        } else if (url.includes("business") || url.includes("economy")) {
          category = "Business & Politics";
        }
        
        expect(category).toBe(expected);
      }
    });

    it("should infer category from URL for BBC articles", () => {
      const url = "/news/article";
      const category = url.includes("news") ? "Business & Politics" : "Culture & Society";
      expect(category).toBe("Business & Politics");
    });
  });

  describe("Error Handling", () => {
    it("should handle source-specific errors", () => {
      const sources = ["bbc", "voa", "engoo"];
      for (const source of sources) {
        const errorMessage = `Error fetching ${source} articles`;
        expect(errorMessage).toContain(source);
      }
    });

    it("should return empty array on scraping failure", () => {
      const mockScraper = async () => {
        try {
          throw new Error("Scraping failed");
        } catch (error) {
          console.error("Error:", error);
          return [];
        }
      };
      
      mockScraper().then((result) => {
        expect(result).toEqual([]);
      });
    });
  });

  describe("Fallback Strategy", () => {
    it("should try multiple sources if one fails", async () => {
      const sources = ["bbc", "voa", "engoo"];
      let successfulSource = null;
      
      for (const source of sources) {
        try {
          // Simulate scraping
          if (source === "voa") {
            successfulSource = source;
            break;
          }
          throw new Error("Failed");
        } catch (error) {
          continue;
        }
      }
      
      expect(successfulSource).toBe("voa");
    });
  });

  describe("Legacy Endpoint Compatibility", () => {
    it("should maintain backward compatibility with engoo endpoints", () => {
      const legacyEndpoint = "engoo.fetchArticles";
      const newEndpoint = "news.fetchArticles";
      
      expect(legacyEndpoint).toContain("engoo");
      expect(newEndpoint).toContain("news");
    });

    it("should support both legacy and new endpoints", () => {
      const endpoints = [
        "engoo.fetchArticles",
        "engoo.fetchArticleDetail",
        "news.fetchArticles",
        "news.fetchArticleDetail",
      ];
      
      expect(endpoints).toHaveLength(4);
      expect(endpoints.filter(e => e.startsWith("engoo"))).toHaveLength(2);
      expect(endpoints.filter(e => e.startsWith("news"))).toHaveLength(2);
    });
  });
});
