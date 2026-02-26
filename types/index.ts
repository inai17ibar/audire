// Article types
export type ArticleCategory =
  | "Business & Politics"
  | "Science & Technology"
  | "Health & Lifestyle"
  | "Culture & Society"
  | "Travel & Experiences";

export type ArticleLevel = 4 | 5 | 6 | 7 | 8 | 9;

export interface Article {
  id: string;
  title: string;
  content: string;
  translation?: string; // Japanese translation
  category: ArticleCategory;
  level: ArticleLevel;
  publishedDate: string; // ISO date string
  audioUrl?: string; // URL to generated TTS audio (cached)
  audioCachedAt?: string; // ISO date string when audio was cached
  localAudioPath?: string; // Local file path for offline playback
  vocabulary?: VocabularyItem[];
  learningRecord?: ArticleLearningRecord; // Learning record for this article
}

export interface ArticleLearningRecord {
  articleId: string;
  practiceCount: number; // Number of times practiced
  totalMinutes: number; // Total practice time in minutes
  bestScore: number; // Best score achieved (0-100)
  lastPracticedAt: string; // ISO date string
  firstPracticedAt: string; // ISO date string
}

export interface VocabularyItem {
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  definition: string;
  example: string;
}

// Practice session types
export interface PracticeSession {
  id: string;
  articleId: string;
  recordingUrl?: string; // Local file path or URL
  transcription?: string;
  feedback?: AIFeedback;
  score?: number; // 0-100
  createdAt: string; // ISO date string
}

export interface AIFeedback {
  overallScore: number; // 0-100
  pronunciation: FeedbackDetail;
  intonation: FeedbackDetail;
  rhythm: FeedbackDetail;
  fluency: FeedbackDetail;
  wordLevelAnalysis?: WordAnalysis[]; // Word-level pronunciation analysis
  strengths?: string[]; // List of strengths
  improvements?: ImprovementArea[]; // Areas for improvement with detailed guidance
  suggestions: string[]; // List of improvement suggestions
  detailedFeedback: string; // Detailed feedback text in Japanese
}

export interface WordAnalysis {
  word: string; // The word with pronunciation issues
  issue: string; // Specific pronunciation issue
  suggestion: string; // How to improve
  example: string; // Correct pronunciation example (IPA or katakana)
}

export interface ImprovementArea {
  area: string; // Area to improve (e.g., "Vowel sounds", "Word stress")
  current: string; // Current state
  target: string; // Target state
  practice: string; // Specific practice method
}

export interface FeedbackDetail {
  score: number; // 0-100
  comment: string;
}

// Audio playback types
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5;

export interface AudioState {
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  speed: PlaybackSpeed;
}

// Script display types
export type ScriptDisplayMode = "english-only" | "english-japanese" | "hidden";

// Learning progress types
export interface LearningStats {
  totalSessions: number;
  currentStreak: number; // consecutive days
  weeklyMinutes: number;
  averageScore: number;
  recentSessions: PracticeSession[];
}

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  unlockedAt?: string; // ISO date string, undefined if not unlocked
  progress?: number; // 0-100, for progressive achievements
  target?: number; // Target value for progressive achievements
}

export type AchievementType =
  | "first_practice" // Complete first practice
  | "practice_10" // Complete 10 practices
  | "practice_50" // Complete 50 practices
  | "practice_100" // Complete 100 practices
  | "streak_3" // 3-day streak
  | "streak_7" // 7-day streak
  | "streak_30" // 30-day streak
  | "perfect_score" // Get 100 score
  | "score_90_plus" // Get 90+ score 10 times
  | "all_categories" // Practice all categories
  | "all_levels"; // Practice all levels

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  ARTICLES: "articles",
  PRACTICE_SESSIONS: "practice_sessions",
  LEARNING_STATS: "learning_stats",
  USER_PREFERENCES: "user_preferences",
  ACHIEVEMENTS: "achievements",
  ARTICLE_LEARNING_RECORDS: "article_learning_records",
} as const;

// User preferences
export interface UserPreferences {
  defaultPlaybackSpeed: PlaybackSpeed;
  defaultScriptMode: ScriptDisplayMode;
  notificationsEnabled: boolean;
  dailyGoalMinutes: number;
}
