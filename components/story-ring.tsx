import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility";
import { cn } from "@/lib/utils";
import type { AudioPost } from "@/lib/audio-context";

interface StoryRingProps {
  stories: AudioPost[];
  onStoryPress?: (story: AudioPost) => void;
  onAddStory?: () => void;
  className?: string;
}

interface StoryItemProps {
  story: AudioPost;
  onPress?: () => void;
  isViewed?: boolean;
}

function StoryItem({ story, onPress, isViewed = false }: StoryItemProps) {
  const colors = useColors();
  const { triggerHaptic } = useAccessibility();

  const initials = story.userName.slice(0, 2);

  // Calculate remaining time
  const remainingTime = story.expiresAt ? story.expiresAt - Date.now() : 0;
  const remainingHours = Math.max(0, Math.floor(remainingTime / 3600000));

  const handlePress = () => {
    triggerHaptic("light");
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.storyItem,
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      accessible
      accessibilityLabel={`${story.userName}さんのストーリー。残り${remainingHours}時間`}
      accessibilityHint="タップしてストーリーを再生します"
      accessibilityRole="button"
    >
      {/* Ring */}
      <View
        style={[
          styles.ring,
          {
            borderColor: isViewed ? colors.muted : colors.primary,
          },
        ]}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Username */}
      <Text
        className="text-xs text-foreground mt-1 text-center"
        numberOfLines={1}
        style={styles.userName}
      >
        {story.userName}
      </Text>

      {/* Remaining time indicator */}
      {remainingHours < 6 && (
        <View style={[styles.timeBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.timeBadgeText}>{remainingHours}h</Text>
        </View>
      )}
    </Pressable>
  );
}

function AddStoryButton({ onPress }: { onPress?: () => void }) {
  const colors = useColors();
  const { triggerHaptic } = useAccessibility();

  const handlePress = () => {
    triggerHaptic("light");
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.storyItem,
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      accessible
      accessibilityLabel="ストーリーを追加"
      accessibilityHint="新しいストーリーを録音して投稿します"
      accessibilityRole="button"
    >
      <View style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.addIcon, { backgroundColor: colors.primary }]}>
          <Text style={styles.addIconText}>+</Text>
        </View>
      </View>
      <Text className="text-xs text-foreground mt-1 text-center" style={styles.userName}>
        追加
      </Text>
    </Pressable>
  );
}

export function StoryRing({
  stories,
  onStoryPress,
  onAddStory,
  className,
}: StoryRingProps) {
  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = story;
    }
    return acc;
  }, {} as Record<string, AudioPost>);

  const uniqueStories = Object.values(groupedStories);

  return (
    <View className={cn("py-4", className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessible
        accessibilityLabel="ストーリー一覧"
        accessibilityRole="none"
      >
        {/* Add story button */}
        <AddStoryButton onPress={onAddStory} />

        {/* Story items */}
        {uniqueStories.map((story) => (
          <StoryItem
            key={story.id}
            story={story}
            onPress={() => onStoryPress?.(story)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: "center",
    width: 72,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  userName: {
    width: 72,
  },
  timeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  addButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: -2,
  },
});
