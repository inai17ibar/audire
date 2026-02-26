import { Article } from "@/types";
import { getArticles, saveArticles } from "./storage";

/**
 * Update article with cached audio URL and timestamp
 */
export async function updateArticleAudioCache(
  articleId: string,
  audioUrl: string,
  audioCachedAt: string
): Promise<void> {
  try {
    const articles = await getArticles();
    const updatedArticles = articles.map((article) =>
      article.id === articleId
        ? { ...article, audioUrl, audioCachedAt }
        : article
    );
    await saveArticles(updatedArticles);
    console.log(`Audio cache updated for article ${articleId}`);
  } catch (error) {
    console.error("Error updating audio cache:", error);
  }
}

/**
 * Check if cached audio is still valid (7 days)
 */
export function isAudioCacheValid(audioCachedAt?: string): boolean {
  if (!audioCachedAt) return false;

  const cacheDate = new Date(audioCachedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff < 7; // Cache valid for 7 days
}

/**
 * Clear expired audio caches from all articles
 */
export async function clearExpiredAudioCaches(): Promise<number> {
  try {
    const articles = await getArticles();
    let clearedCount = 0;

    const updatedArticles = articles.map((article) => {
      if (article.audioUrl && !isAudioCacheValid(article.audioCachedAt)) {
        clearedCount++;
        const { audioUrl, audioCachedAt, ...rest } = article;
        return rest;
      }
      return article;
    });

    if (clearedCount > 0) {
      await saveArticles(updatedArticles);
      console.log(`Cleared ${clearedCount} expired audio caches`);
    }

    return clearedCount;
  } catch (error) {
    console.error("Error clearing expired audio caches:", error);
    return 0;
  }
}

/**
 * Clear all audio caches
 */
export async function clearAllAudioCaches(): Promise<number> {
  try {
    const articles = await getArticles();
    let clearedCount = 0;

    const updatedArticles = articles.map((article) => {
      if (article.audioUrl) {
        clearedCount++;
        const { audioUrl, audioCachedAt, ...rest } = article;
        return rest;
      }
      return article;
    });

    if (clearedCount > 0) {
      await saveArticles(updatedArticles);
      console.log(`Cleared all ${clearedCount} audio caches`);
    }

    return clearedCount;
  } catch (error) {
    console.error("Error clearing all audio caches:", error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getAudioCacheStats(): Promise<{
  totalCached: number;
  validCached: number;
  expiredCached: number;
}> {
  try {
    const articles = await getArticles();
    const cachedArticles = articles.filter((article) => article.audioUrl);

    const validCached = cachedArticles.filter((article) =>
      isAudioCacheValid(article.audioCachedAt)
    ).length;

    return {
      totalCached: cachedArticles.length,
      validCached,
      expiredCached: cachedArticles.length - validCached,
    };
  } catch (error) {
    console.error("Error getting audio cache stats:", error);
    return { totalCached: 0, validCached: 0, expiredCached: 0 };
  }
}
