import React, { useCallback, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AudioCard } from "@/components/audio-card";
import { LiveRoomCard } from "@/components/live-room-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudio, type AudioPost } from "@/lib/audio-context";
import { useAccessibility } from "@/lib/accessibility";

// Categories for discovery
const CATEGORIES = [
  { id: "trending", name: "トレンド", icon: "🔥" },
  { id: "music", name: "音楽", icon: "🎵" },
  { id: "talk", name: "トーク", icon: "💬" },
  { id: "nature", name: "自然", icon: "🌿" },
  { id: "asmr", name: "ASMR", icon: "🎧" },
  { id: "story", name: "物語", icon: "📖" },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const { posts, liveRooms, toggleLike } = useAudio();
  const { triggerHaptic, announce } = useAccessibility();

  // Announce screen on mount
  useEffect(() => {
    announce(`発見画面です。${liveRooms.length}件のライブ配信と、トレンドの音声を探索できます。`);
  }, [announce, liveRooms.length]);

  const handleCategoryPress = useCallback((categoryId: string, categoryName: string) => {
    triggerHaptic("light");
    announce(`${categoryName}カテゴリを選択しました`);
  }, [triggerHaptic, announce]);

  const handleLiveRoomPress = useCallback((roomId: string) => {
    triggerHaptic("light");
    announce("ライブルームに参加します");
  }, [triggerHaptic, announce]);

  // Sort posts by likes for "trending"
  const trendingPosts = [...posts].sort((a, b) => b.likes - a.likes);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4">
          <Text
            className="text-2xl font-bold text-foreground"
            accessible
            accessibilityRole="header"
          >
            発見
          </Text>
          <Text className="text-base text-muted mt-1">
            新しい音声を探索しよう
          </Text>
        </View>

        {/* Search Bar (placeholder) */}
        <Pressable
          style={({ pressed }) => [
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.8 },
          ]}
          className="mx-4 mb-4"
          accessible
          accessibilityLabel="検索"
          accessibilityHint="タップして音声やユーザーを検索します"
          accessibilityRole="search"
        >
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <Text className="text-base text-muted ml-3">
            音声やユーザーを検索
          </Text>
        </Pressable>

        {/* Categories */}
        <View className="mb-6">
          <Text
            className="text-lg font-semibold text-foreground px-4 mb-3"
            accessible
            accessibilityRole="header"
          >
            カテゴリ
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.id, category.name)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  { backgroundColor: colors.surface },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                accessible
                accessibilityLabel={category.name}
                accessibilityRole="button"
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text className="text-sm font-medium text-foreground mt-1">
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Live Rooms Section */}
        {liveRooms.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text
                className="text-lg font-semibold text-foreground"
                accessible
                accessibilityRole="header"
              >
                ライブ配信中
              </Text>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                accessible
                accessibilityLabel="すべてのライブを見る"
                accessibilityRole="button"
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  すべて見る
                </Text>
              </Pressable>
            </View>
            <View className="px-4">
              {liveRooms.slice(0, 2).map((room) => (
                <LiveRoomCard
                  key={room.id}
                  room={room}
                  onPress={() => handleLiveRoomPress(room.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Trending Posts */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text
              className="text-lg font-semibold text-foreground"
              accessible
              accessibilityRole="header"
            >
              トレンド
            </Text>
          </View>
          <View className="px-4">
            {trendingPosts.slice(0, 5).map((post) => (
              <AudioCard
                key={post.id}
                post={post}
                onLike={() => toggleLike(post.id)}
                onComment={() => {
                  triggerHaptic("light");
                }}
                onUserPress={() => {
                  triggerHaptic("light");
                }}
              />
            ))}
          </View>
        </View>

        {/* Recommended Users (placeholder) */}
        <View className="mb-8 px-4">
          <Text
            className="text-lg font-semibold text-foreground mb-3"
            accessible
            accessibilityRole="header"
          >
            おすすめユーザー
          </Text>
          <View className="bg-surface rounded-2xl p-4">
            <View className="flex-row items-center">
              <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.userAvatarText}>田中</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-foreground">
                  田中太郎
                </Text>
                <Text className="text-sm text-muted">
                  毎朝の散歩音声を投稿中
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.followButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9 },
                ]}
                accessible
                accessibilityLabel="田中太郎さんをフォロー"
                accessibilityRole="button"
              >
                <Text style={styles.followButtonText}>フォロー</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  categoryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 80,
  },
  categoryIcon: {
    fontSize: 28,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
