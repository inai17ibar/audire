import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AudioPlayer } from "@/components/audio-player";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudio, type AudioPost } from "@/lib/audio-context";
import { useAccessibility, formatRelativeTimeForA11y } from "@/lib/accessibility";

export default function StoriesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { stories } = useAudio();
  const { triggerHaptic, announce } = useAccessibility();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Announce screen on mount
  useEffect(() => {
    announce(`ストーリー画面です。${stories.length}件のストーリーがあります。`);
  }, [announce, stories.length]);

  const currentStory = stories[currentStoryIndex];

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      triggerHaptic("light");
      setCurrentStoryIndex(currentStoryIndex - 1);
      announce(`前のストーリー。${stories[currentStoryIndex - 1].userName}さん`);
    }
  }, [currentStoryIndex, stories, triggerHaptic, announce]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      triggerHaptic("light");
      setCurrentStoryIndex(currentStoryIndex + 1);
      announce(`次のストーリー。${stories[currentStoryIndex + 1].userName}さん`);
    }
  }, [currentStoryIndex, stories, triggerHaptic, announce]);

  const handleAddStory = useCallback(() => {
    triggerHaptic("light");
    router.push("/(tabs)/record" as any);
  }, [triggerHaptic, router]);

  // Calculate remaining time for current story
  const getRemainingTime = (expiresAt?: number) => {
    if (!expiresAt) return "24時間";
    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    if (hours > 0) return `残り${hours}時間`;
    return `残り${minutes}分`;
  };

  const renderStoryItem = useCallback(({ item, index }: { item: AudioPost; index: number }) => {
    const isActive = index === currentStoryIndex;
    const initials = item.userName.slice(0, 2);

    return (
      <Pressable
        onPress={() => {
          triggerHaptic("light");
          setCurrentStoryIndex(index);
          announce(`${item.userName}さんのストーリーを選択しました`);
        }}
        style={({ pressed }) => [
          styles.storyThumb,
          isActive && { borderColor: colors.primary, borderWidth: 2 },
          pressed && { opacity: 0.8 },
        ]}
        accessible
        accessibilityLabel={`${item.userName}さんのストーリー`}
        accessibilityState={{ selected: isActive }}
        accessibilityRole="button"
      >
        <View style={[styles.thumbAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.thumbAvatarText}>{initials}</Text>
        </View>
        <Text
          className="text-xs text-foreground mt-1 text-center"
          numberOfLines={1}
          style={{ width: 60 }}
        >
          {item.userName}
        </Text>
      </Pressable>
    );
  }, [currentStoryIndex, colors, triggerHaptic, announce]);

  if (stories.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <IconSymbol name="clock.fill" size={64} color={colors.muted} />
        <Text className="text-xl font-semibold text-foreground mt-6 text-center">
          ストーリーがありません
        </Text>
        <Text className="text-base text-muted mt-2 text-center">
          24時間で消える音声日記を投稿してみましょう
        </Text>
        <Pressable
          onPress={handleAddStory}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessible
          accessibilityLabel="ストーリーを投稿"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>ストーリーを投稿</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text
          className="text-2xl font-bold text-foreground"
          accessible
          accessibilityRole="header"
        >
          ストーリー
        </Text>
        <Pressable
          onPress={handleAddStory}
          style={({ pressed }) => [
            styles.headerAddButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
          accessible
          accessibilityLabel="ストーリーを追加"
          accessibilityRole="button"
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Story Thumbnails */}
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ maxHeight: 100 }}
      />

      {/* Current Story Display */}
      {currentStory && (
        <View className="flex-1 px-4 pt-6">
          {/* Story Header */}
          <View className="flex-row items-center mb-6">
            <View style={[styles.storyAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.storyAvatarText}>
                {currentStory.userName.slice(0, 2)}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-lg font-semibold text-foreground">
                {currentStory.userName}
              </Text>
              <Text className="text-sm text-muted">
                {formatRelativeTimeForA11y(currentStory.createdAt)} • {getRemainingTime(currentStory.expiresAt)}
              </Text>
            </View>
          </View>

          {/* Progress Indicator */}
          <View className="flex-row gap-1 mb-6">
            {stories.map((_, index) => (
              <View
                key={index}
                className="flex-1 h-1 rounded-full"
                style={{
                  backgroundColor: index <= currentStoryIndex ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Audio Player */}
          <View className="bg-surface rounded-2xl p-6 mb-6">
            <View className="items-center mb-4">
              <IconSymbol name="waveform" size={48} color={colors.primary} />
            </View>
            <AudioPlayer
              uri={currentStory.audioUri}
              duration={currentStory.duration}
              onPlayStateChange={setIsPlaying}
            />
          </View>

          {/* Caption */}
          {currentStory.caption && (
            <Text className="text-base text-foreground text-center mb-6">
              {currentStory.caption}
            </Text>
          )}

          {/* Navigation Controls */}
          <View className="flex-row justify-center gap-8">
            <Pressable
              onPress={handlePrevious}
              disabled={currentStoryIndex === 0}
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: colors.surface },
                currentStoryIndex === 0 && { opacity: 0.3 },
                pressed && { opacity: 0.7 },
              ]}
              accessible
              accessibilityLabel="前のストーリー"
              accessibilityRole="button"
              accessibilityState={{ disabled: currentStoryIndex === 0 }}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>

            <Pressable
              onPress={handleNext}
              disabled={currentStoryIndex === stories.length - 1}
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: colors.surface },
                currentStoryIndex === stories.length - 1 && { opacity: 0.3 },
                pressed && { opacity: 0.7 },
              ]}
              accessible
              accessibilityLabel="次のストーリー"
              accessibilityRole="button"
              accessibilityState={{ disabled: currentStoryIndex === stories.length - 1 }}
            >
              <IconSymbol name="chevron.right" size={28} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  storyThumb: {
    alignItems: "center",
    marginRight: 12,
    padding: 4,
    borderRadius: 12,
  },
  thumbAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 24,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
