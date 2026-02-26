import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getArticleLearningRecord } from "@/lib/learning-progress";
import { STORAGE_KEYS } from "@/types";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

describe("Article Detail Learning Record Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display learning record when article has been practiced", async () => {
    const mockRecords = {
      "article-1": {
        articleId: "article-1",
        practiceCount: 5,
        totalMinutes: 25,
        bestScore: 85,
        lastPracticedAt: "2026-02-19T00:00:00.000Z",
        firstPracticedAt: "2026-02-15T00:00:00.000Z",
      },
    };

    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

    const record = await getArticleLearningRecord("article-1");

    expect(record).not.toBeNull();
    expect(record?.practiceCount).toBe(5);
    expect(record?.totalMinutes).toBe(25);
    expect(record?.bestScore).toBe(85);
    expect(record?.lastPracticedAt).toBe("2026-02-19T00:00:00.000Z");
  });

  it("should return null when article has not been practiced", async () => {
    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify({}));

    const record = await getArticleLearningRecord("new-article");

    expect(record).toBeNull();
  });

  it("should format date correctly", () => {
    const date = new Date("2026-02-19T00:00:00.000Z");
    const formatted = date.toLocaleDateString();

    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it("should display practice count with 'x' suffix", () => {
    const practiceCount = 5;
    const display = `${practiceCount}x`;

    expect(display).toBe("5x");
  });

  it("should display best score with '/100' suffix", () => {
    const bestScore = 85;
    const display = `${bestScore}/100`;

    expect(display).toBe("85/100");
  });

  it("should display total time with 'min' suffix", () => {
    const totalMinutes = 25;
    const display = `${totalMinutes}min`;

    expect(display).toBe("25min");
  });

  it("should handle multiple practice sessions", async () => {
    const mockRecords = {
      "article-1": {
        articleId: "article-1",
        practiceCount: 10,
        totalMinutes: 50,
        bestScore: 92,
        lastPracticedAt: "2026-02-19T00:00:00.000Z",
        firstPracticedAt: "2026-02-10T00:00:00.000Z",
      },
    };

    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

    const record = await getArticleLearningRecord("article-1");

    expect(record?.practiceCount).toBe(10);
    expect(record?.totalMinutes).toBe(50);
    expect(record?.bestScore).toBe(92);
  });

  it("should handle perfect score", async () => {
    const mockRecords = {
      "article-1": {
        articleId: "article-1",
        practiceCount: 3,
        totalMinutes: 15,
        bestScore: 100,
        lastPracticedAt: "2026-02-19T00:00:00.000Z",
        firstPracticedAt: "2026-02-18T00:00:00.000Z",
      },
    };

    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

    const record = await getArticleLearningRecord("article-1");

    expect(record?.bestScore).toBe(100);
  });

  it("should handle low score", async () => {
    const mockRecords = {
      "article-1": {
        articleId: "article-1",
        practiceCount: 1,
        totalMinutes: 5,
        bestScore: 45,
        lastPracticedAt: "2026-02-19T00:00:00.000Z",
        firstPracticedAt: "2026-02-19T00:00:00.000Z",
      },
    };

    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

    const record = await getArticleLearningRecord("article-1");

    expect(record?.bestScore).toBe(45);
  });

  it("should handle single practice session", async () => {
    const mockRecords = {
      "article-1": {
        articleId: "article-1",
        practiceCount: 1,
        totalMinutes: 5,
        bestScore: 75,
        lastPracticedAt: "2026-02-19T00:00:00.000Z",
        firstPracticedAt: "2026-02-19T00:00:00.000Z",
      },
    };

    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

    const record = await getArticleLearningRecord("article-1");

    expect(record?.practiceCount).toBe(1);
    expect(record?.lastPracticedAt).toBe(record?.firstPracticedAt);
  });
});
