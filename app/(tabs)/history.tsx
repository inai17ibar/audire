import { useState, useEffect } from "react";
import { FlatList, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { LearningStats, PracticeSession } from "@/types";
import { getLearningStats, getArticleById } from "@/lib/storage";

export default function HistoryScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const fetchedStats = await getLearningStats();
    setStats(fetchedStats);
    setLoading(false);
  }

  function handleSessionPress(session: PracticeSession) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/review-detail/${session.id}` as any);
  }

  function renderSessionCard({ item }: { item: PracticeSession }) {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity
        onPress={() => handleSessionPress(item)}
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted text-xs">{formattedDate} {formattedTime}</Text>
          {item.score !== undefined && (
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-bold">{item.score}</Text>
            </View>
          )}
        </View>
        
        <Text className="text-foreground text-base" numberOfLines={2}>
          Article ID: {item.articleId}
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!stats) {
    return (
      <ScreenContainer className="justify-center items-center px-4">
        <Text className="text-foreground text-xl font-semibold">No data available</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-foreground mb-2">Learning History</Text>
        <Text className="text-muted text-base">Track your progress and improvement</Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-primary/10 rounded-2xl p-4">
          <Text className="text-muted text-xs mb-1">Current Streak</Text>
          <Text className="text-primary text-3xl font-bold">{stats.currentStreak}</Text>
          <Text className="text-muted text-xs">days</Text>
        </View>
        
        <View className="flex-1 bg-success/10 rounded-2xl p-4">
          <Text className="text-muted text-xs mb-1">Avg Score</Text>
          <Text className="text-success text-3xl font-bold">{stats.averageScore}</Text>
          <Text className="text-muted text-xs">out of 100</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-surface rounded-2xl p-4">
          <Text className="text-muted text-xs mb-1">Total Sessions</Text>
          <Text className="text-foreground text-2xl font-bold">{stats.totalSessions}</Text>
        </View>
        
        <View className="flex-1 bg-surface rounded-2xl p-4">
          <Text className="text-muted text-xs mb-1">This Week</Text>
          <Text className="text-foreground text-2xl font-bold">{stats.weeklyMinutes}</Text>
          <Text className="text-muted text-xs">minutes</Text>
        </View>
      </View>

      {/* Recent Sessions */}
      <View className="mb-4">
        <Text className="text-foreground text-xl font-bold mb-3">Recent Sessions</Text>
      </View>

      <FlatList
        data={stats.recentSessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-muted text-base">No practice sessions yet</Text>
            <Text className="text-muted text-sm mt-2">Start practicing to see your history!</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
