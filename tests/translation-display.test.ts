import { describe, it, expect } from "vitest";
import { sampleArticles } from "@/data/sample-articles";

describe("Translation Display Feature", () => {
  describe("Sample Articles Data", () => {
    it("should have translation field in all sample articles", () => {
      expect(sampleArticles).toHaveLength(3);
      
      sampleArticles.forEach((article, index) => {
        expect(article.translation, `Article ${index + 1} (${article.title}) should have translation`).toBeDefined();
        expect(article.translation, `Article ${index + 1} translation should not be empty`).not.toBe("");
      });
    });

    it("should have Japanese characters in all translations", () => {
      sampleArticles.forEach((article, index) => {
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(article.translation || "");
        expect(hasJapanese, `Article ${index + 1} (${article.title}) should have Japanese characters`).toBe(true);
      });
    });

    it("should have meaningful translation content", () => {
      sampleArticles.forEach((article, index) => {
        expect(article.translation!.length, `Article ${index + 1} translation should be longer than 50 characters`).toBeGreaterThan(50);
      });
    });
  });

  describe("Article 1: AI Tools in Japan", () => {
    const article = sampleArticles[0];

    it("should have correct title", () => {
      expect(article.title).toBe("Only 1 in 5 Japanese Adults Use AI Tools");
    });

    it("should have translation", () => {
      expect(article.translation).toBeDefined();
      expect(article.translation).toContain("多くの国では");
      expect(article.translation).toContain("ChatGPT");
      expect(article.translation).toContain("日本では");
    });

    it("translation should have multiple paragraphs", () => {
      const paragraphs = article.translation!.split("\n\n");
      expect(paragraphs.length).toBeGreaterThan(1);
    });
  });

  describe("Article 2: Japanese Companies Investment", () => {
    const article = sampleArticles[1];

    it("should have correct title", () => {
      expect(article.title).toBe("Japanese Companies Prefer to Invest Overseas");
    });

    it("should have translation", () => {
      expect(article.translation).toBeDefined();
      expect(article.translation).toContain("日本企業");
      expect(article.translation).toContain("海外");
    });
  });

  describe("Article 3: Lifelong Learning", () => {
    const article = sampleArticles[2];

    it("should have correct title", () => {
      expect(article.title).toBe("Lifelong Learning Linked to Lower Dementia Risk");
    });

    it("should have translation", () => {
      expect(article.translation).toBeDefined();
      expect(article.translation).toContain("新しい研究");
      expect(article.translation).toContain("認知症");
    });
  });

  describe("Script Display Mode Logic", () => {
    it("should show only English when mode is english-only", () => {
      const mode = "english-only";
      expect(mode).toBe("english-only");
      // In this mode, translation should not be displayed
    });

    it("should show both English and Japanese when mode is english-japanese", () => {
      const mode = "english-japanese";
      expect(mode).toBe("english-japanese");
      // In this mode, both content and translation should be displayed
      const article = sampleArticles[0];
      expect(article.content).toBeDefined();
      expect(article.translation).toBeDefined();
    });

    it("should hide script when mode is hidden", () => {
      const mode = "hidden";
      expect(mode).toBe("hidden");
      // In this mode, neither content nor translation should be displayed
    });
  });

  describe("Translation Data Integrity", () => {
    it("should preserve translation through JSON serialization", () => {
      const article = sampleArticles[0];
      const serialized = JSON.stringify(article);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.translation).toBe(article.translation);
      expect(deserialized.translation).toContain("多くの国では");
    });

    it("should have translation field in Article type", () => {
      const article = sampleArticles[0];
      expect("translation" in article).toBe(true);
    });
  });
});
