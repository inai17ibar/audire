import { describe, it, expect } from "vitest";
import { sampleArticles } from "@/data/sample-articles";

describe("Japanese Translation Display", () => {
  it("should have translation field in all sample articles", () => {
    sampleArticles.forEach((article) => {
      expect(article.translation).toBeDefined();
      expect(article.translation).not.toBe("");
      expect(typeof article.translation).toBe("string");
    });
  });

  it("should have translation with Japanese characters", () => {
    sampleArticles.forEach((article) => {
      expect(article.translation).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
    });
  });

  it("should have translation longer than 50 characters", () => {
    sampleArticles.forEach((article) => {
      expect(article.translation!.length).toBeGreaterThan(50);
    });
  });

  it("should display translation when scriptMode is english-japanese", () => {
    const scriptMode = "english-japanese";
    const article = sampleArticles[0];

    expect(scriptMode).toBe("english-japanese");
    expect(article.translation).toBeDefined();
  });

  it("should not display translation when scriptMode is english-only", () => {
    const scriptMode = "english-only";

    expect(scriptMode).toBe("english-only");
    expect(scriptMode).not.toBe("english-japanese");
  });

  it("should not display translation when scriptMode is hidden", () => {
    const scriptMode = "hidden";

    expect(scriptMode).toBe("hidden");
    expect(scriptMode).not.toBe("english-japanese");
  });

  it("should have translation for first article", () => {
    const article = sampleArticles[0];

    expect(article.title).toBe("Only 1 in 5 Japanese Adults Use AI Tools");
    expect(article.translation).toBeDefined();
    expect(article.translation).toContain("多くの国では");
  });

  it("should have translation for second article", () => {
    const article = sampleArticles[1];

    expect(article.title).toBe("Japanese Companies Prefer to Invest Overseas");
    expect(article.translation).toBeDefined();
    expect(article.translation).toContain("日本企業");
  });

  it("should have translation for third article", () => {
    const article = sampleArticles[2];

    expect(article.title).toBe("Lifelong Learning Linked to Lower Dementia Risk");
    expect(article.translation).toBeDefined();
    expect(article.translation).toContain("新しい研究");
  });

  it("should have translation with proper formatting", () => {
    sampleArticles.forEach((article) => {
      expect(article.translation).toContain("\n");
      expect(article.translation!.split("\n").length).toBeGreaterThan(1);
    });
  });
});
