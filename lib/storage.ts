import AsyncStorage from "@react-native-async-storage/async-storage";
import { Article, PracticeSession, LearningStats, UserPreferences, STORAGE_KEYS } from "@/types";
import { updateArticleLearningRecord, checkAndUnlockAchievements, calculatePracticeDuration } from "@/lib/learning-progress";

// Articles
export async function getArticles(): Promise<Article[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting articles:", error);
    return [];
  }
}

export async function saveArticles(articles: Article[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  } catch (error) {
    console.error("Error saving articles:", error);
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find((article) => article.id === id) || null;
}

// Practice Sessions
export async function getPracticeSessions(): Promise<PracticeSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting practice sessions:", error);
    return [];
  }
}

export async function savePracticeSession(session: PracticeSession): Promise<void> {
  try {
    const sessions = await getPracticeSessions();
    sessions.push(session);
    await AsyncStorage.setItem(STORAGE_KEYS.PRACTICE_SESSIONS, JSON.stringify(sessions));
    await updateLearningStats(session);

    // Update article learning record
    if (session.score !== undefined) {
      const practiceMinutes = calculatePracticeDuration(session);
      await updateArticleLearningRecord(session.articleId, session.score, practiceMinutes);
    }

    // Check and unlock achievements
    const stats = await getLearningStats();
    await checkAndUnlockAchievements(sessions, stats);
  } catch (error) {
    console.error("Error saving practice session:", error);
  }
}

export async function getSessionsByArticleId(articleId: string): Promise<PracticeSession[]> {
  const sessions = await getPracticeSessions();
  return sessions.filter((session) => session.articleId === articleId);
}

// Learning Stats
export async function getLearningStats(): Promise<LearningStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
    if (data) {
      return JSON.parse(data);
    }
    // Default stats
    return {
      totalSessions: 0,
      currentStreak: 0,
      weeklyMinutes: 0,
      averageScore: 0,
      recentSessions: [],
    };
  } catch (error) {
    console.error("Error getting learning stats:", error);
    return {
      totalSessions: 0,
      currentStreak: 0,
      weeklyMinutes: 0,
      averageScore: 0,
      recentSessions: [],
    };
  }
}

export async function updateLearningStats(newSession: PracticeSession): Promise<void> {
  try {
    const stats = await getLearningStats();
    const sessions = await getPracticeSessions();

    // Update total sessions
    stats.totalSessions = sessions.length;

    // Calculate average score
    const sessionsWithScore = sessions.filter((s) => s.score !== undefined);
    if (sessionsWithScore.length > 0) {
      const totalScore = sessionsWithScore.reduce((sum, s) => sum + (s.score || 0), 0);
      stats.averageScore = Math.round(totalScore / sessionsWithScore.length);
    }

    // Calculate streak (consecutive days)
    stats.currentStreak = calculateStreak(sessions);

    // Calculate weekly minutes (last 7 days)
    stats.weeklyMinutes = calculateWeeklyMinutes(sessions);

    // Update recent sessions (last 10)
    stats.recentSessions = sessions.slice(-10).reverse();

    await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error("Error updating learning stats:", error);
  }
}

// User Preferences
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
    // Default preferences
    return {
      defaultPlaybackSpeed: 1.0,
      defaultScriptMode: "english-only",
      notificationsEnabled: true,
      dailyGoalMinutes: 30,
    };
  } catch (error) {
    console.error("Error getting user preferences:", error);
    return {
      defaultPlaybackSpeed: 1.0,
      defaultScriptMode: "english-only",
      notificationsEnabled: true,
      dailyGoalMinutes: 30,
    };
  }
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
}

// Helper functions
function calculateStreak(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0;

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.createdAt);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate.getTime() < currentDate.getTime()) {
      break;
    }
  }

  return streak;
}

function calculateWeeklyMinutes(sessions: PracticeSession[]): number {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = sessions.filter(
    (session) => new Date(session.createdAt) >= sevenDaysAgo
  );

  // Estimate 5 minutes per session (can be adjusted based on actual duration tracking)
  return recentSessions.length * 5;
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ARTICLES,
      STORAGE_KEYS.PRACTICE_SESSIONS,
      STORAGE_KEYS.LEARNING_STATS,
      STORAGE_KEYS.USER_PREFERENCES,
    ]);
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}
