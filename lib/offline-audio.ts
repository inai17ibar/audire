import { File, Directory, Paths } from "expo-file-system";
import * as Network from "expo-network";
import { Platform } from "react-native";
import { Article } from "@/types";
import { getArticles, saveArticles } from "./storage";

// Web環境ではPaths.documentが使えないため、条件分岐
const getAudioDirectory = () => {
  if (Platform.OS === "web") {
    // Web環境では機能を無効化
    return null;
  }
  return new Directory(Paths.document, "audio");
};

const AUDIO_DIR = getAudioDirectory();

/**
 * Ensure audio directory exists
 */
async function ensureAudioDirectory(): Promise<void> {
  if (!AUDIO_DIR || Platform.OS === "web") {
    console.warn("Offline audio not supported on web");
    return;
  }
  if (!AUDIO_DIR.exists) {
    AUDIO_DIR.create();
    console.log("Audio directory created");
  }
}

/**
 * Download audio file for offline playback
 */
export async function downloadAudioForOffline(
  articleId: string,
  audioUrl: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  if (!AUDIO_DIR || Platform.OS === "web") {
    console.warn("Offline audio not supported on web");
    return null;
  }
  
  try {
    await ensureAudioDirectory();

    const localFile = new File(AUDIO_DIR, `${articleId}.mp3`);
    
    // Check if already downloaded
    if (localFile.exists) {
      console.log(`Audio already downloaded: ${localFile.uri}`);
      return localFile.uri;
    }

    // Download file
    const downloadedFile = await File.downloadFileAsync(audioUrl, AUDIO_DIR);
    if (downloadedFile && downloadedFile.exists) {
      console.log(`Audio downloaded successfully: ${downloadedFile.uri}`);
      
      // Rename to article ID
      downloadedFile.move(localFile);
      
      // Update article with local path
      await updateArticleLocalAudioPath(articleId, localFile.uri);
      
      // Call progress callback with 100%
      onProgress?.(1.0);
      
      return localFile.uri;
    }

    return null;
  } catch (error) {
    console.error("Error downloading audio:", error);
    return null;
  }
}

/**
 * Update article with local audio path
 */
async function updateArticleLocalAudioPath(
  articleId: string,
  localPath: string
): Promise<void> {
  try {
    const articles = await getArticles();
    const updatedArticles = articles.map((article) =>
      article.id === articleId
        ? { ...article, localAudioPath: localPath }
        : article
    );
    await saveArticles(updatedArticles);
    console.log(`Local audio path updated for article ${articleId}`);
  } catch (error) {
    console.error("Error updating local audio path:", error);
  }
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isInternetReachable ?? false;
  } catch (error) {
    console.error("Error checking network state:", error);
    return false;
  }
}

/**
 * Get audio URL for playback (local if offline, remote if online)
 */
export async function getAudioUrlForPlayback(
  article: Article
): Promise<string | null> {
  // Check if local audio exists
  if (article.localAudioPath) {
    try {
      const localFile = new File(article.localAudioPath);
      if (localFile.exists) {
        const online = await isOnline();
        if (!online) {
          console.log("Offline: using local audio");
          return article.localAudioPath;
        }
      }
    } catch (error) {
      console.error("Error checking local audio:", error);
    }
  }

  // Use remote audio if online
  if (article.audioUrl) {
    const online = await isOnline();
    if (online) {
      console.log("Online: using remote audio");
      return article.audioUrl;
    }
  }

  // No audio available
  console.warn("No audio available for playback");
  return null;
}

/**
 * Delete local audio file
 */
export async function deleteLocalAudio(articleId: string): Promise<boolean> {
  if (!AUDIO_DIR || Platform.OS === "web") {
    console.warn("Offline audio not supported on web");
    return false;
  }
  
  try {
    const localFile = new File(AUDIO_DIR, `${articleId}.mp3`);
    
    if (localFile.exists) {
      localFile.delete();
      console.log(`Local audio deleted: ${localFile.uri}`);
      
      // Update article to remove local path
      const articles = await getArticles();
      const updatedArticles = articles.map((article) =>
        article.id === articleId
          ? { ...article, localAudioPath: undefined }
          : article
      );
      await saveArticles(updatedArticles);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error deleting local audio:", error);
    return false;
  }
}

/**
 * Get all downloaded audio files info
 */
export async function getDownloadedAudioInfo(): Promise<{
  count: number;
  totalSize: number;
  files: { articleId: string; size: number; path: string }[];
}> {
  if (!AUDIO_DIR || Platform.OS === "web") {
    console.warn("Offline audio not supported on web");
    return { count: 0, totalSize: 0, files: [] };
  }
  
  try {
    await ensureAudioDirectory();
    
    const files = AUDIO_DIR.list();
    let totalSize = 0;
    const fileInfos: { articleId: string; size: number; path: string }[] = [];

    for (const item of files) {
      if (item instanceof File) {
        const fileName = item.name;
        if (fileName.endsWith(".mp3")) {
          if (item.exists) {
            const articleId = fileName.replace(".mp3", "");
            const size = item.size;
            totalSize += size;
            fileInfos.push({
              articleId,
              size,
              path: item.uri,
            });
          }
        }
      }
    }

    return {
      count: fileInfos.length,
      totalSize,
      files: fileInfos,
    };
  } catch (error) {
    console.error("Error getting downloaded audio info:", error);
    return { count: 0, totalSize: 0, files: [] };
  }
}

/**
 * Delete all local audio files
 */
export async function deleteAllLocalAudio(): Promise<number> {
  try {
    const info = await getDownloadedAudioInfo();
    let deletedCount = 0;

    for (const file of info.files) {
      const success = await deleteLocalAudio(file.articleId);
      if (success) {
        deletedCount++;
      }
    }

    console.log(`Deleted ${deletedCount} local audio files`);
    return deletedCount;
  } catch (error) {
    console.error("Error deleting all local audio:", error);
    return 0;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
