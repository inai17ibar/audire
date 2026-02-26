import React, { useState } from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Article } from "@/types";
import { downloadAudioForOffline, deleteLocalAudio } from "@/lib/offline-audio";

interface OfflineDownloadButtonProps {
  article: Article;
  onDownloadComplete?: () => void;
}

export function OfflineDownloadButton({
  article,
  onDownloadComplete,
}: OfflineDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasLocalAudio = !!article.localAudioPath;
  const hasRemoteAudio = !!article.audioUrl;

  async function handleDownload() {
    if (!hasRemoteAudio) {
      console.warn("No remote audio URL available");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const localPath = await downloadAudioForOffline(
        article.id,
        article.audioUrl!,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      if (localPath) {
        console.log("Download complete:", localPath);
        onDownloadComplete?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        console.error("Download failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error downloading audio:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }

  async function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDeleting(true);

    try {
      const success = await deleteLocalAudio(article.id);
      if (success) {
        console.log("Local audio deleted");
        onDownloadComplete?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error deleting local audio:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!hasRemoteAudio && !hasLocalAudio) {
    return null;
  }

  if (isDownloading) {
    return (
      <View className="bg-primary/10 px-4 py-2 rounded-full flex-row items-center gap-2">
        <ActivityIndicator size="small" color="#0a7ea4" />
        <Text className="text-primary text-sm font-medium">
          ダウンロード中... {Math.round(downloadProgress * 100)}%
        </Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View className="bg-error/10 px-4 py-2 rounded-full flex-row items-center gap-2">
        <ActivityIndicator size="small" color="#EF4444" />
        <Text className="text-error text-sm font-medium">削除中...</Text>
      </View>
    );
  }

  if (hasLocalAudio) {
    return (
      <TouchableOpacity
        onPress={handleDelete}
        className="bg-success/10 px-4 py-2 rounded-full"
        activeOpacity={0.7}
      >
        <Text className="text-success text-sm font-medium">
          ✓ オフライン再生可能 (削除)
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleDownload}
      className="bg-primary/10 px-4 py-2 rounded-full"
      activeOpacity={0.7}
    >
      <Text className="text-primary text-sm font-medium">
        ↓ オフライン用にダウンロード
      </Text>
    </TouchableOpacity>
  );
}
