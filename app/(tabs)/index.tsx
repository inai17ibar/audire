import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { StoryRing } from "@/components/story-ring";
import { AudioCard } from "@/components/audio-card";
import { LiveRoomCard } from "@/components/live-room-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudio, type AudioPost } from "@/lib/audio-context";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";
import { VoiceAgent, VoiceAgentButton, type VoiceCommand } from "@/components/voice-agent";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { posts, stories, liveRooms, isLoading, refreshPosts, toggleLike } = useAudio();
  const { user } = useAppAuth();
  const { announce, triggerHaptic } = useAccessibility();
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);

  // Announce screen on mount
  useEffect(() => {
    announce(`ホーム画面。${posts.length}件の投稿があります。`);
  }, [announce, posts.length]);

  const handleRefresh = useCallback(async () => {
    triggerHaptic("light");
    await refreshPosts();
    announce("タイムラインを更新しました");
  }, [refreshPosts, triggerHaptic, announce]);

  const handleStoryPress = useCallback((story: AudioPost) => {
    triggerHaptic("light");
    // Navigate to story viewer
    announce(`${story.userName}さんのストーリーを再生します`);
  }, [triggerHaptic, announce]);

  const handleAddStory = useCallback(() => {
    triggerHaptic("light");
    router.push("/(tabs)/record" as any);
  }, [triggerHaptic, router]);

  const handleLikePost = useCallback((postId: string) => {
    toggleLike(postId);
  }, [toggleLike]);

  const handleLiveRoomPress = useCallback((roomId: string) => {
    triggerHaptic("light");
    announce("ライブルームに参加します");
    // Navigate to live room
  }, [triggerHaptic, announce]);

  const renderHeader = useCallback(() => (
    <View>
      {/* App Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text
          className="text-2xl font-bold text-foreground"
          accessible
          accessibilityRole="header"
        >
          Audire
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && { opacity: 0.7 },
          ]}
          accessible
          accessibilityLabel="通知"
          accessibilityRole="button"
        >
          <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Stories Section */}
      <StoryRing
        stories={stories}
        onStoryPress={handleStoryPress}
        onAddStory={handleAddStory}
      />

      {/* Live Rooms Section (if any) */}
      {liveRooms.length > 0 && (
        <View className="px-4 mb-4">
          <Text
            className="text-lg font-semibold text-foreground mb-3"
            accessible
            accessibilityRole="header"
          >
            ライブ配信中
          </Text>
          <LiveRoomCard
            room={liveRooms[0]}
            onPress={() => handleLiveRoomPress(liveRooms[0].id)}
          />
        </View>
      )}

      {/* Timeline Header */}
      <View className="px-4 pb-2">
        <Text
          className="text-lg font-semibold text-foreground"
          accessible
          accessibilityRole="header"
        >
          タイムライン
        </Text>
      </View>
    </View>
  ), [stories, liveRooms, colors.foreground, handleStoryPress, handleAddStory, handleLiveRoomPress]);

  const renderPost = useCallback(({ item }: { item: AudioPost }) => (
    <View className="px-4">
      <AudioCard
        post={item}
        onLike={() => handleLikePost(item.id)}
        onComment={() => {
          triggerHaptic("light");
          announce(`${item.userName}さんの投稿にコメントします`);
        }}
        onUserPress={() => {
          triggerHaptic("light");
          announce(`${item.userName}さんのプロフィールを表示します`);
        }}
      />
    </View>
  ), [handleLikePost, triggerHaptic, announce]);

  const renderEmpty = useCallback(() => (
    <View className="items-center justify-center py-16">
      <IconSymbol name="waveform" size={64} color={colors.muted} />
      <Text className="text-lg text-muted mt-4 text-center">
        まだ投稿がありません
      </Text>
      <Text className="text-base text-muted mt-2 text-center">
        最初の音声を録音してみましょう
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/record" as any)}
        style={({ pressed }) => [
          styles.emptyButton,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        accessible
        accessibilityLabel="録音を開始"
        accessibilityRole="button"
      >
        <Text style={styles.emptyButtonText}>録音を開始</Text>
      </Pressable>
    </View>
  ), [colors, router]);

  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    switch (command) {
      case "home":
        // Already on home
        break;
      case "discover":
        router.push("/(tabs)/discover" as any);
        break;
      case "stories":
        router.push("/(tabs)/stories" as any);
        break;
      case "profile":
        router.push("/(tabs)/profile" as any);
        break;
      case "record_start":
        router.push("/(tabs)/record" as any);
        break;
      default:
        break;
    }
  }, [router]);

  return (
    <ScreenContainer>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        accessible
        accessibilityLabel="タイムライン"
        accessibilityRole="list"
      />

      {/* Voice Agent */}
      <VoiceAgentButton onPress={() => setShowVoiceAgent(true)} />
      <VoiceAgent
        visible={showVoiceAgent}
        onClose={() => setShowVoiceAgent(false)}
        onCommand={handleVoiceCommand}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
