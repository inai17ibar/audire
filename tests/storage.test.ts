import { describe, it, expect, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getArticles,
  saveArticles,
  getArticleById,
  getPracticeSessions,
  savePracticeSession,
  getLearningStats,
  getUserPreferences,
  saveUserPreferences,
  clearAllData,
} from "../lib/storage";
import { Article, PracticeSession, UserPreferences } from "../types";

describe("Storage", () => {
  beforeEach(async () => {
    // Clear all data before each test
    await clearAllData();
  });

  describe("Articles", () => {
    it("should save and retrieve articles", async () => {
      const articles: Article[] = [
        {
          id: "1",
          title: "Test Article",
          content: "Test content",
          category: "Science & Technology",
          level: 5,
          publishedDate: "2026-02-18",
        },
      ];

      await saveArticles(articles);
      const retrieved = await getArticles();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe("1");
      expect(retrieved[0].title).toBe("Test Article");
    });

    it("should get article by id", async () => {
      const articles: Article[] = [
        {
          id: "1",
          title: "Test Article 1",
          content: "Content 1",
          category: "Science & Technology",
          level: 5,
          publishedDate: "2026-02-18",
        },
        {
          id: "2",
          title: "Test Article 2",
          content: "Content 2",
          category: "Business & Politics",
          level: 7,
          publishedDate: "2026-02-18",
        },
      ];

      await saveArticles(articles);
      const article = await getArticleById("2");

      expect(article).not.toBeNull();
      expect(article?.title).toBe("Test Article 2");
    });

    it("should return null for non-existent article", async () => {
      const article = await getArticleById("999");
      expect(article).toBeNull();
    });
  });

  describe("Practice Sessions", () => {
    it("should save and retrieve practice sessions", async () => {
      const session: PracticeSession = {
        id: "1",
        articleId: "1",
        score: 85,
        createdAt: new Date().toISOString(),
      };

      await savePracticeSession(session);
      const sessions = await getPracticeSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].score).toBe(85);
    });
  });

  describe("Learning Stats", () => {
    it("should return default stats when no data exists", async () => {
      const stats = await getLearningStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.weeklyMinutes).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });

  describe("User Preferences", () => {
    it("should save and retrieve user preferences", async () => {
      const prefs: UserPreferences = {
        defaultPlaybackSpeed: 1.5,
        defaultScriptMode: "english-only",
        notificationsEnabled: false,
        dailyGoalMinutes: 45,
      };

      await saveUserPreferences(prefs);
      const retrieved = await getUserPreferences();

      expect(retrieved.defaultPlaybackSpeed).toBe(1.5);
      expect(retrieved.notificationsEnabled).toBe(false);
    });

    it("should return default preferences when no data exists", async () => {
      const prefs = await getUserPreferences();

      expect(prefs.defaultPlaybackSpeed).toBe(1.0);
      expect(prefs.defaultScriptMode).toBe("english-only");
      expect(prefs.notificationsEnabled).toBe(true);
      expect(prefs.dailyGoalMinutes).toBe(30);
    });
  });
});
