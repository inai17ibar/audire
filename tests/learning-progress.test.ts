import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getArticleLearningRecord,
  updateArticleLearningRecord,
  getAllArticleLearningRecords,
  getAchievements,
  checkAndUnlockAchievements,
  calculatePracticeDuration,
} from "@/lib/learning-progress";
import { STORAGE_KEYS, PracticeSession, LearningStats } from "@/types";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

describe("Learning Progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Article Learning Record", () => {
    it("should get article learning record", async () => {
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

      expect(record).toEqual(mockRecords["article-1"]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ARTICLE_LEARNING_RECORDS);
    });

    it("should return null for non-existent article", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify({}));

      const record = await getArticleLearningRecord("non-existent");

      expect(record).toBeNull();
    });

    it("should update article learning record", async () => {
      const mockRecords = {
        "article-1": {
          articleId: "article-1",
          practiceCount: 5,
          totalMinutes: 25,
          bestScore: 85,
          lastPracticedAt: "2026-02-18T00:00:00.000Z",
          firstPracticedAt: "2026-02-15T00:00:00.000Z",
        },
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

      await updateArticleLearningRecord("article-1", 90, 5);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"practiceCount":6')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"totalMinutes":30')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"bestScore":90')
      );
    });

    it("should create new article learning record", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      await updateArticleLearningRecord("new-article", 75, 5);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"practiceCount":1')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"totalMinutes":5')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ARTICLE_LEARNING_RECORDS,
        expect.stringContaining('"bestScore":75')
      );
    });

    it("should get all article learning records", async () => {
      const mockRecords = {
        "article-1": {
          articleId: "article-1",
          practiceCount: 5,
          totalMinutes: 25,
          bestScore: 85,
          lastPracticedAt: "2026-02-19T00:00:00.000Z",
          firstPracticedAt: "2026-02-15T00:00:00.000Z",
        },
        "article-2": {
          articleId: "article-2",
          practiceCount: 3,
          totalMinutes: 15,
          bestScore: 78,
          lastPracticedAt: "2026-02-18T00:00:00.000Z",
          firstPracticedAt: "2026-02-17T00:00:00.000Z",
        },
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockRecords));

      const records = await getAllArticleLearningRecords();

      expect(records).toHaveLength(2);
      expect(records[0].articleId).toBe("article-1");
      expect(records[1].articleId).toBe("article-2");
    });
  });

  describe("Achievements", () => {
    it("should get achievements", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const achievements = await getAchievements();

      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements[0]).toHaveProperty("id");
      expect(achievements[0]).toHaveProperty("title");
      expect(achievements[0]).toHaveProperty("description");
      expect(achievements[0]).toHaveProperty("icon");
    });

    it("should unlock first practice achievement", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const sessions: PracticeSession[] = [
        {
          id: "session-1",
          articleId: "article-1",
          score: 75,
          createdAt: "2026-02-19T00:00:00.000Z",
        },
      ];

      const stats: LearningStats = {
        totalSessions: 1,
        currentStreak: 1,
        weeklyMinutes: 5,
        averageScore: 75,
        recentSessions: sessions,
      };

      const unlockedAchievements = await checkAndUnlockAchievements(sessions, stats);

      expect(unlockedAchievements.length).toBeGreaterThan(0);
      expect(unlockedAchievements[0].id).toBe("first_practice");
    });

    it("should unlock practice count milestones", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const sessions: PracticeSession[] = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        articleId: "article-1",
        score: 75,
        createdAt: "2026-02-19T00:00:00.000Z",
      }));

      const stats: LearningStats = {
        totalSessions: 10,
        currentStreak: 1,
        weeklyMinutes: 50,
        averageScore: 75,
        recentSessions: sessions.slice(-10),
      };

      const unlockedAchievements = await checkAndUnlockAchievements(sessions, stats);

      expect(unlockedAchievements.some((a) => a.id === "practice_10")).toBe(true);
    });

    it("should unlock streak milestones", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const sessions: PracticeSession[] = [
        {
          id: "session-1",
          articleId: "article-1",
          score: 75,
          createdAt: "2026-02-19T00:00:00.000Z",
        },
      ];

      const stats: LearningStats = {
        totalSessions: 7,
        currentStreak: 7,
        weeklyMinutes: 35,
        averageScore: 75,
        recentSessions: sessions,
      };

      const unlockedAchievements = await checkAndUnlockAchievements(sessions, stats);

      expect(unlockedAchievements.some((a) => a.id === "streak_7")).toBe(true);
    });

    it("should unlock perfect score achievement", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const sessions: PracticeSession[] = [
        {
          id: "session-1",
          articleId: "article-1",
          score: 100,
          createdAt: "2026-02-19T00:00:00.000Z",
        },
      ];

      const stats: LearningStats = {
        totalSessions: 1,
        currentStreak: 1,
        weeklyMinutes: 5,
        averageScore: 100,
        recentSessions: sessions,
      };

      const unlockedAchievements = await checkAndUnlockAchievements(sessions, stats);

      expect(unlockedAchievements.some((a) => a.id === "perfect_score")).toBe(true);
    });

    it("should unlock high score achievement", async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const sessions: PracticeSession[] = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        articleId: "article-1",
        score: 95,
        createdAt: "2026-02-19T00:00:00.000Z",
      }));

      const stats: LearningStats = {
        totalSessions: 10,
        currentStreak: 1,
        weeklyMinutes: 50,
        averageScore: 95,
        recentSessions: sessions.slice(-10),
      };

      const unlockedAchievements = await checkAndUnlockAchievements(sessions, stats);

      expect(unlockedAchievements.some((a) => a.id === "score_90_plus")).toBe(true);
    });
  });

  describe("Practice Duration", () => {
    it("should calculate practice duration", () => {
      const session: PracticeSession = {
        id: "session-1",
        articleId: "article-1",
        score: 75,
        createdAt: "2026-02-19T00:00:00.000Z",
      };

      const duration = calculatePracticeDuration(session);

      expect(duration).toBe(5);
    });
  });
});
