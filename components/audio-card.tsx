import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { AudioPlayer } from "./audio-player";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility, formatRelativeTimeForA11y, formatDurationForA11y } from "@/lib/accessibility";
import { cn } from "@/lib/utils";
import type { AudioPost } from "@/lib/audio-context";

interface AudioCardProps {
  post: AudioPost;
  onLike?: () => void;
  onComment?: () => void;
  onUserPress?: () => void;
  className?: string;
}

export function AudioCard({
  post,
  onLike,
  onComment,
  onUserPress,
  className,
}: AudioCardProps) {
  const colors = useColors();
  const { triggerHaptic } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = useCallback(() => {
    triggerHaptic(post.isLiked ? "light" : "success");
    onLike?.();
  }, [triggerHaptic, post.isLiked, onLike]);

  const handleComment = useCallback(() => {
    triggerHaptic("light");
    onComment?.();
  }, [triggerHaptic, onComment]);

  // Generate initials for avatar
  const initials = post.userName.slice(0, 2);

  return (
    <View
      className={cn("bg-surface rounded-2xl p-4 mb-4", className)}
      accessible
      accessibilityLabel={`${post.userName}さんの投稿。${post.caption || ""}。${formatDurationForA11y(post.duration)}の音声。${post.likes}いいね、${post.comments}コメント。${formatRelativeTimeForA11y(post.createdAt)}に投稿`}
      accessibilityRole="none"
    >
      {/* Header: User info */}
      <Pressable
        onPress={onUserPress}
        style={({ pressed }) => [
          styles.header,
          pressed && { opacity: 0.7 },
        ]}
        accessible
        accessibilityLabel={`${post.userName}さんのプロフィールを表示`}
        accessibilityRole="button"
      >
        {/* Avatar */}
        <View
          style={[styles.avatar, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* User name and time */}
        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold text-foreground">
            {post.userName}
          </Text>
          <Text className="text-sm text-muted">
            {formatRelativeTimeForA11y(post.createdAt)}
          </Text>
        </View>

        {/* Duration badge */}
        <View className="bg-background px-3 py-1 rounded-full">
          <Text className="text-sm text-muted">
            {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      </Pressable>

      {/* Caption */}
      {post.caption && (
        <Text
          className="text-base text-foreground mt-3 leading-6"
          accessible
          accessibilityRole="text"
        >
          {post.caption}
        </Text>
      )}

      {/* Audio player */}
      <View className="mt-4">
        <AudioPlayer
          uri={post.audioUri}
          duration={post.duration}
          onPlayStateChange={setIsPlaying}
        />
      </View>

      {/* Effects indicator */}
      {(post.soundEffect || post.bgmTrack) && (
        <View className="flex-row gap-2 mt-3">
          {post.soundEffect && (
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-sm text-primary">🎵 エフェクト付き</Text>
            </View>
          )}
          {post.bgmTrack && (
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-sm text-primary">🎶 BGM付き</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions: Like and Comment */}
      <View className="flex-row gap-6 mt-4 pt-4 border-t border-border">
        {/* Like button */}
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessible
          accessibilityLabel={post.isLiked ? `いいね済み、${post.likes}いいね` : `いいね、${post.likes}いいね`}
          accessibilityHint={post.isLiked ? "いいねを取り消します" : "いいねを追加します"}
          accessibilityRole="button"
          accessibilityState={{ selected: post.isLiked }}
        >
          <IconSymbol
            name={post.isLiked ? "heart.fill" : "heart"}
            size={24}
            color={post.isLiked ? colors.error : colors.muted}
          />
          <Text
            className={cn(
              "text-base ml-2",
              post.isLiked ? "text-error" : "text-muted"
            )}
          >
            {post.likes}
          </Text>
        </Pressable>

        {/* Comment button */}
        <Pressable
          onPress={handleComment}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessible
          accessibilityLabel={`コメント、${post.comments}件`}
          accessibilityHint="コメントを表示します"
          accessibilityRole="button"
        >
          <IconSymbol
            name="bubble.left.fill"
            size={24}
            color={colors.muted}
          />
          <Text className="text-base text-muted ml-2">
            {post.comments}
          </Text>
        </Pressable>

        {/* Share button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { marginLeft: "auto" },
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessible
          accessibilityLabel="共有"
          accessibilityHint="この投稿を共有します"
          accessibilityRole="button"
        >
          <IconSymbol
            name="square.and.arrow.up"
            size={24}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
