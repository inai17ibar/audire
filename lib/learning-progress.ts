import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  STORAGE_KEYS,
  ArticleLearningRecord,
  Achievement,
  AchievementType,
  PracticeSession,
  LearningStats,
} from "@/types";

/**
 * Get learning record for a specific article
 */
export async function getArticleLearningRecord(
  articleId: string
): Promise<ArticleLearningRecord | null> {
  try {
    const recordsJson = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLE_LEARNING_RECORDS);
    if (!recordsJson) return null;

    const records: Record<string, ArticleLearningRecord> = JSON.parse(recordsJson);
    return records[articleId] || null;
  } catch (error) {
    console.error("Error getting article learning record:", error);
    return null;
  }
}

/**
 * Update learning record for an article after practice
 */
export async function updateArticleLearningRecord(
  articleId: string,
  sessionScore: number,
  practiceMinutes: number
): Promise<void> {
  try {
    const recordsJson = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLE_LEARNING_RECORDS);
    const records: Record<string, ArticleLearningRecord> = recordsJson
      ? JSON.parse(recordsJson)
      : {};

    const existingRecord = records[articleId];
    const now = new Date().toISOString();

    if (existingRecord) {
      // Update existing record
      records[articleId] = {
        ...existingRecord,
        practiceCount: existingRecord.practiceCount + 1,
        totalMinutes: existingRecord.totalMinutes + practiceMinutes,
        bestScore: Math.max(existingRecord.bestScore, sessionScore),
        lastPracticedAt: now,
      };
    } else {
      // Create new record
      records[articleId] = {
        articleId,
        practiceCount: 1,
        totalMinutes: practiceMinutes,
        bestScore: sessionScore,
        lastPracticedAt: now,
        firstPracticedAt: now,
      };
    }

    await AsyncStorage.setItem(STORAGE_KEYS.ARTICLE_LEARNING_RECORDS, JSON.stringify(records));
  } catch (error) {
    console.error("Error updating article learning record:", error);
  }
}

/**
 * Get all learning records
 */
export async function getAllArticleLearningRecords(): Promise<ArticleLearningRecord[]> {
  try {
    const recordsJson = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLE_LEARNING_RECORDS);
    if (!recordsJson) return [];

    const records: Record<string, ArticleLearningRecord> = JSON.parse(recordsJson);
    return Object.values(records);
  } catch (error) {
    console.error("Error getting all article learning records:", error);
    return [];
  }
}

/**
 * Initialize default achievements
 */
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_practice",
    title: "はじめの一歩",
    description: "初めてのシャドーイング練習を完了",
    icon: "🎯",
  },
  {
    id: "practice_10",
    title: "継続は力なり",
    description: "10回の練習を完了",
    icon: "💪",
  },
  {
    id: "practice_50",
    title: "努力家",
    description: "50回の練習を完了",
    icon: "🔥",
  },
  {
    id: "practice_100",
    title: "マスター",
    description: "100回の練習を完了",
    icon: "👑",
  },
  {
    id: "streak_3",
    title: "3日連続",
    description: "3日連続で練習を完了",
    icon: "📅",
  },
  {
    id: "streak_7",
    title: "1週間連続",
    description: "7日連続で練習を完了",
    icon: "🌟",
  },
  {
    id: "streak_30",
    title: "1ヶ月連続",
    description: "30日連続で練習を完了",
    icon: "🏆",
  },
  {
    id: "perfect_score",
    title: "パーフェクト",
    description: "100点を獲得",
    icon: "💯",
  },
  {
    id: "score_90_plus",
    title: "優秀",
    description: "90点以上を10回獲得",
    icon: "⭐",
  },
  {
    id: "all_categories",
    title: "多様性",
    description: "全カテゴリーで練習を完了",
    icon: "🌈",
  },
  {
    id: "all_levels",
    title: "チャレンジャー",
    description: "全レベルで練習を完了",
    icon: "🚀",
  },
];

/**
 * Get all achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  try {
    const achievementsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!achievementsJson) {
      // Initialize with default achievements
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      return DEFAULT_ACHIEVEMENTS;
    }

    return JSON.parse(achievementsJson);
  } catch (error) {
    console.error("Error getting achievements:", error);
    return DEFAULT_ACHIEVEMENTS;
  }
}

/**
 * Check and unlock achievements based on current stats
 */
export async function checkAndUnlockAchievements(
  sessions: PracticeSession[],
  stats: LearningStats
): Promise<Achievement[]> {
  try {
    const achievements = await getAchievements();
    const now = new Date().toISOString();
    let updated = false;
    const newlyUnlocked: Achievement[] = [];

    // Check first practice
    if (sessions.length >= 1 && !achievements.find((a) => a.id === "first_practice")?.unlockedAt) {
      const achievement = achievements.find((a) => a.id === "first_practice");
      if (achievement) {
        achievement.unlockedAt = now;
        newlyUnlocked.push(achievement);
        updated = true;
      }
    }

    // Check practice count milestones
    const practiceCount = sessions.length;
    const milestones: { count: number; id: AchievementType }[] = [
      { count: 10, id: "practice_10" },
      { count: 50, id: "practice_50" },
      { count: 100, id: "practice_100" },
    ];

    for (const milestone of milestones) {
      if (practiceCount >= milestone.count) {
        const achievement = achievements.find((a) => a.id === milestone.id);
        if (achievement && !achievement.unlockedAt) {
          achievement.unlockedAt = now;
          newlyUnlocked.push(achievement);
          updated = true;
        }
      }
    }

    // Check streak milestones
    const streakMilestones: { days: number; id: AchievementType }[] = [
      { days: 3, id: "streak_3" },
      { days: 7, id: "streak_7" },
      { days: 30, id: "streak_30" },
    ];

    for (const milestone of streakMilestones) {
      if (stats.currentStreak >= milestone.days) {
        const achievement = achievements.find((a) => a.id === milestone.id);
        if (achievement && !achievement.unlockedAt) {
          achievement.unlockedAt = now;
          newlyUnlocked.push(achievement);
          updated = true;
        }
      }
    }

    // Check perfect score
    const hasPerfectScore = sessions.some((s) => s.score === 100);
    if (hasPerfectScore) {
      const achievement = achievements.find((a) => a.id === "perfect_score");
      if (achievement && !achievement.unlockedAt) {
        achievement.unlockedAt = now;
        newlyUnlocked.push(achievement);
        updated = true;
      }
    }

    // Check 90+ score count
    const highScoreCount = sessions.filter((s) => s.score && s.score >= 90).length;
    if (highScoreCount >= 10) {
      const achievement = achievements.find((a) => a.id === "score_90_plus");
      if (achievement && !achievement.unlockedAt) {
        achievement.unlockedAt = now;
        newlyUnlocked.push(achievement);
        updated = true;
      }
    }

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
}

/**
 * Get unlocked achievements count
 */
export async function getUnlockedAchievementsCount(): Promise<number> {
  const achievements = await getAchievements();
  return achievements.filter((a) => a.unlockedAt).length;
}

/**
 * Calculate practice duration from session
 */
export function calculatePracticeDuration(session: PracticeSession): number {
  // Estimate practice duration based on recording length or default to 5 minutes
  // In a real implementation, you would track actual practice time
  return 5; // Default 5 minutes per session
}
