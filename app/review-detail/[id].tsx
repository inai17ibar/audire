import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { PracticeSession, Article } from "@/types";
import { getPracticeSessions, getArticleById } from "@/lib/storage";

export default function ReviewDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetail();
  }, [id]);

  async function loadSessionDetail() {
    setLoading(true);
    try {
      const sessions = await getPracticeSessions();
      const foundSession = sessions.find((s) => s.id === id);
      
      if (foundSession) {
        setSession(foundSession);
        const foundArticle = await getArticleById(foundSession.articleId);
        setArticle(foundArticle);
      }
    } catch (error) {
      console.error("Error loading session detail:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!session || !article) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-foreground text-lg font-semibold mb-2">レビューが見つかりません</Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-full mt-4"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const date = new Date(session.createdAt);
  const formattedDate = date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={handleBack}
            className="mb-4 self-start"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-base font-medium">← 戻る</Text>
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold mb-2">レビュー詳細</Text>
          <Text className="text-muted text-sm">{formattedDate}</Text>
        </View>

        {/* Article Info */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-muted text-xs mb-1">{article.category}</Text>
          <Text className="text-foreground text-lg font-semibold mb-2">{article.title}</Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-primary text-xs font-medium">Level {article.level}</Text>
            </View>
            <Text className="text-muted text-xs">{new Date(article.publishedDate).toLocaleDateString("ja-JP")}</Text>
          </View>
        </View>

        {/* Overall Score */}
        <View className="bg-primary/10 rounded-2xl p-6 mb-4 items-center">
          <Text className="text-muted text-sm mb-2">総合スコア</Text>
          <Text className="text-primary text-5xl font-bold">{session.score}</Text>
          <Text className="text-muted text-xs mt-1">/ 100</Text>
        </View>

        {/* Detailed Scores */}
        {session.feedback && (
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <Text className="text-foreground text-lg font-semibold mb-4">詳細評価</Text>
            
            {/* Pronunciation */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-medium">発音</Text>
                <Text className="text-primary font-bold">{session.feedback.pronunciation.score}</Text>
              </View>
              <View className="h-2 bg-background rounded-full overflow-hidden mb-1">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${session.feedback.pronunciation.score}%` }}
                />
              </View>
              <Text className="text-muted text-sm">{session.feedback.pronunciation.comment}</Text>
            </View>

            {/* Intonation */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-medium">イントネーション</Text>
                <Text className="text-primary font-bold">{session.feedback.intonation.score}</Text>
              </View>
              <View className="h-2 bg-background rounded-full overflow-hidden mb-1">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${session.feedback.intonation.score}%` }}
                />
              </View>
              <Text className="text-muted text-sm">{session.feedback.intonation.comment}</Text>
            </View>

            {/* Rhythm */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-medium">リズム</Text>
                <Text className="text-primary font-bold">{session.feedback.rhythm.score}</Text>
              </View>
              <View className="h-2 bg-background rounded-full overflow-hidden mb-1">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${session.feedback.rhythm.score}%` }}
                />
              </View>
              <Text className="text-muted text-sm">{session.feedback.rhythm.comment}</Text>
            </View>

            {/* Fluency */}
            <View className="mb-0">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-medium">流暢さ</Text>
                <Text className="text-primary font-bold">{session.feedback.fluency.score}</Text>
              </View>
              <View className="h-2 bg-background rounded-full overflow-hidden mb-1">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${session.feedback.fluency.score}%` }}
                />
              </View>
              <Text className="text-muted text-sm">{session.feedback.fluency.comment}</Text>
            </View>
          </View>
        )}

        {/* Transcription Comparison */}
        {session.transcription && (
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <Text className="text-foreground text-lg font-semibold mb-3">文字起こし結果</Text>
            <View className="bg-background rounded-xl p-3 mb-3">
              <Text className="text-muted text-xs mb-1">元のテキスト</Text>
              <Text className="text-foreground text-sm leading-relaxed">{article.content}</Text>
            </View>
            <View className="bg-background rounded-xl p-3">
              <Text className="text-muted text-xs mb-1">あなたの発音</Text>
              <Text className="text-foreground text-sm leading-relaxed">{session.transcription}</Text>
            </View>
          </View>
        )}

        {/* Detailed Feedback */}
        {session.feedback?.detailedFeedback && (
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <Text className="text-foreground text-lg font-semibold mb-3">詳細フィードバック</Text>
            <Text className="text-foreground text-sm leading-relaxed">
              {session.feedback.detailedFeedback}
            </Text>
          </View>
        )}

        {/* Suggestions */}
        {session.feedback?.suggestions && session.feedback.suggestions.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-foreground text-lg font-semibold mb-3">改善提案</Text>
            {session.feedback.suggestions.map((suggestion, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-primary mr-2">•</Text>
                <Text className="text-foreground text-sm flex-1 leading-relaxed">{suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Practice Again Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/practice/${article.id}` as any);
          }}
          className="bg-primary rounded-full py-4 items-center mb-6"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">この記事をもう一度練習する</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
