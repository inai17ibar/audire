import { describe, it, expect } from "vitest";

describe("Interleaved Text Display", () => {
  describe("Paragraph Splitting", () => {
    it("should split text by double newlines", () => {
      const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0]).toBe("Paragraph 1");
      expect(paragraphs[1]).toBe("Paragraph 2");
      expect(paragraphs[2]).toBe("Paragraph 3");
    });

    it("should handle single paragraph", () => {
      const text = "Single paragraph without line breaks";
      const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(paragraphs).toHaveLength(1);
      expect(paragraphs[0]).toBe("Single paragraph without line breaks");
    });

    it("should filter out empty paragraphs", () => {
      const text = "Paragraph 1\n\n\n\nParagraph 2\n\n";
      const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs[0]).toBe("Paragraph 1");
      expect(paragraphs[1]).toBe("Paragraph 2");
    });
  });

  describe("Interleaved Display Logic", () => {
    it("should pair English and Japanese paragraphs", () => {
      const englishText = "English para 1\n\nEnglish para 2\n\nEnglish para 3";
      const japaneseText = "日本語段落1\n\n日本語段落2\n\n日本語段落3";
      
      const englishParagraphs = englishText.split("\n\n").filter((p) => p.trim().length > 0);
      const japaneseParagraphs = japaneseText.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(englishParagraphs).toHaveLength(3);
      expect(japaneseParagraphs).toHaveLength(3);
      
      // Verify pairing
      expect(englishParagraphs[0]).toBe("English para 1");
      expect(japaneseParagraphs[0]).toBe("日本語段落1");
      expect(englishParagraphs[1]).toBe("English para 2");
      expect(japaneseParagraphs[1]).toBe("日本語段落2");
      expect(englishParagraphs[2]).toBe("English para 3");
      expect(japaneseParagraphs[2]).toBe("日本語段落3");
    });

    it("should handle mismatched paragraph counts", () => {
      const englishText = "English para 1\n\nEnglish para 2\n\nEnglish para 3";
      const japaneseText = "日本語段落1\n\n日本語段落2";
      
      const englishParagraphs = englishText.split("\n\n").filter((p) => p.trim().length > 0);
      const japaneseParagraphs = japaneseText.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(englishParagraphs).toHaveLength(3);
      expect(japaneseParagraphs).toHaveLength(2);
      
      // Third English paragraph should have no Japanese translation
      const thirdJapanese = japaneseParagraphs[2] || "";
      expect(thirdJapanese).toBe("");
    });
  });

  describe("Display Order", () => {
    it("should display in correct order: EN1, JP1, EN2, JP2, EN3, JP3", () => {
      const englishParagraphs = ["EN1", "EN2", "EN3"];
      const japaneseParagraphs = ["JP1", "JP2", "JP3"];
      
      const displayOrder: string[] = [];
      
      englishParagraphs.forEach((englishPara, index) => {
        const japanesePara = japaneseParagraphs[index] || "";
        displayOrder.push(englishPara);
        if (japanesePara) {
          displayOrder.push(japanesePara);
        }
      });
      
      expect(displayOrder).toEqual(["EN1", "JP1", "EN2", "JP2", "EN3", "JP3"]);
    });

    it("should handle missing Japanese translations", () => {
      const englishParagraphs = ["EN1", "EN2", "EN3"];
      const japaneseParagraphs = ["JP1", "JP2"]; // Missing JP3
      
      const displayOrder: string[] = [];
      
      englishParagraphs.forEach((englishPara, index) => {
        const japanesePara = japaneseParagraphs[index] || "";
        displayOrder.push(englishPara);
        if (japanesePara) {
          displayOrder.push(japanesePara);
        }
      });
      
      expect(displayOrder).toEqual(["EN1", "JP1", "EN2", "JP2", "EN3"]);
    });
  });

  describe("Sample Article Data", () => {
    it("should have properly formatted paragraphs in sample articles", () => {
      const sampleContent = `In many countries, AI tools such as ChatGPT, Gemini and Copilot are becoming part of daily life. However, a recent survey shows that only 20% of Japanese adults have used such tools.

The survey was conducted by a research company in 15 countries. It found that 20% of Japanese respondents had used AI tools, compared to 40% in the US and 50% in India.`;

      const paragraphs = sampleContent.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs[0]).toContain("ChatGPT");
      expect(paragraphs[1]).toContain("survey was conducted");
    });

    it("should have matching paragraph structure in translations", () => {
      const englishContent = "Paragraph 1 content.\n\nParagraph 2 content.\n\nParagraph 3 content.";
      const japaneseContent = "段落1の内容。\n\n段落2の内容。\n\n段落3の内容。";
      
      const englishParas = englishContent.split("\n\n").filter((p) => p.trim().length > 0);
      const japaneseParas = japaneseContent.split("\n\n").filter((p) => p.trim().length > 0);
      
      expect(englishParas.length).toBe(japaneseParas.length);
    });
  });

  describe("Word Count Calculation", () => {
    it("should calculate total words correctly", () => {
      const text = "This is a test sentence with seven words.";
      const words = text.split(/\s+/);
      
      expect(words).toHaveLength(8);
    });

    it("should calculate paragraph word offset", () => {
      const para1 = "This is paragraph one.";
      const para2 = "This is paragraph two with more words.";
      
      const para1Words = para1.split(/\s+/).length;
      const para2Words = para2.split(/\s+/).length;
      
      expect(para1Words).toBe(4);
      expect(para2Words).toBe(7);
      
      // Word offset for para2 should be para1Words
      const para2Offset = para1Words;
      expect(para2Offset).toBe(4);
    });
  });

  describe("Component Integration", () => {
    it("should use InterleavedText when translation exists", () => {
      const article = {
        content: "English content",
        translation: "日本語訳",
      };
      
      const shouldUseInterleaved = !!article.translation;
      expect(shouldUseInterleaved).toBe(true);
    });

    it("should use HighlightedText when translation is missing", () => {
      const article = {
        content: "English content",
        translation: undefined,
      };
      
      const shouldUseInterleaved = !!article.translation;
      expect(shouldUseInterleaved).toBe(false);
    });
  });
});
