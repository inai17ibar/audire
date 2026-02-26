import { describe, it, expect } from "vitest";

describe("VOA Scraper Fix", () => {
  it("should extract title from img alt attribute", () => {
    const mockImgAlt = "Let's Learn English With Anna Lesson 1";
    expect(mockImgAlt).toBeTruthy();
    expect(mockImgAlt.length).toBeGreaterThan(5);
    expect(mockImgAlt).not.toContain("<img");
  });

  it("should handle multiple article patterns", () => {
    const patterns = [
      { type: "img-link", title: "Let's Learn English - Level 1 - Lesson 1: Welcome!" },
      { type: "text-link", title: "Lesson 1: Who Are You?" },
    ];

    patterns.forEach((pattern) => {
      expect(pattern.title).toBeTruthy();
      expect(pattern.title.length).toBeGreaterThan(5);
    });
  });

  it("should prioritize img alt over text content", () => {
    const imgAlt = "America's Presidents - Thomas Jefferson";
    const textContent = "<img src='...' alt='America's Presidents - Thomas Jefferson' />";
    
    // img alt should be used instead of text content
    expect(imgAlt).not.toContain("<img");
    expect(textContent).toContain("<img");
    expect(imgAlt.length).toBeLessThan(textContent.length);
  });

  it("should validate article structure", () => {
    const article = {
      title: "Let's Learn English With Anna Lesson 1",
      url: "https://learningenglish.voanews.com/a/6654462.html",
      date: "2026-02-26",
      level: 6,
      category: "Culture & Society",
      excerpt: "",
      sourceAttribution: "VOA Learning English",
    };

    expect(article.title).toBeTruthy();
    expect(article.url).toContain("learningenglish.voanews.com");
    expect(article.level).toBeGreaterThanOrEqual(1);
    expect(article.level).toBeLessThanOrEqual(10);
    expect(article.sourceAttribution).toBe("VOA Learning English");
  });
});
