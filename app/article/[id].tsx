import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Article, ArticleLearningRecord } from "@/types";
import { getArticleById } from "@/lib/storage";
import { getArticleLearningRecord } from "@/lib/learning-progress";

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [learningRecord, setLearningRecord] = useState<ArticleLearningRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    if (!id) return;
    setLoading(true);
    const fetchedArticle = await getArticleById(id);
    setArticle(fetchedArticle);
    
    // Load learning record
    if (fetchedArticle) {
      const record = await getArticleLearningRecord(fetchedArticle.id);
      setLearningRecord(record);
    }
    
    setLoading(false);
  }

  function handleStartPractice() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (article) {
      router.push(`/practice/${article.id}` as any);
    }
  }

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!article) {
    return (
      <ScreenContainer className="justify-center items-center px-4">
        <Text className="text-foreground text-xl font-semibold mb-2">Article not found</Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-full mt-4"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={handleBack}
          className="mr-3 p-2"
          activeOpacity={0.7}
        >
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center mb-3">
          <View className="bg-primary/10 px-3 py-1 rounded-full mr-2">
            <Text className="text-primary text-sm font-semibold">Level {article.level}</Text>
          </View>
          <View className="bg-surface px-3 py-1 rounded-full">
            <Text className="text-foreground text-sm">{article.category}</Text>
          </View>
        </View>

        <Text className="text-foreground text-2xl font-bold mb-2">{article.title}</Text>
        <Text className="text-muted text-sm mb-4">{article.publishedDate}</Text>

        {learningRecord && (
          <View className="bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/20">
            <Text className="text-primary text-lg font-bold mb-3">📊 Your Progress</Text>
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-3">
                <Text className="text-muted text-xs mb-1">Practice Count</Text>
                <Text className="text-foreground text-xl font-bold">{learningRecord.practiceCount}x</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-muted text-xs mb-1">Best Score</Text>
                <Text className="text-foreground text-xl font-bold">{learningRecord.bestScore}/100</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-muted text-xs mb-1">Total Time</Text>
                <Text className="text-foreground text-xl font-bold">{learningRecord.totalMinutes}min</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-muted text-xs mb-1">Last Practiced</Text>
                <Text className="text-foreground text-sm font-semibold">
                  {new Date(learningRecord.lastPracticedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="bg-surface rounded-2xl p-4 mb-6">
          <Text className="text-foreground text-base leading-relaxed">{article.content}</Text>
        </View>

        {article.vocabulary && article.vocabulary.length > 0 && (
          <View className="mb-6">
            <Text className="text-foreground text-xl font-bold mb-3">Vocabulary</Text>
            {article.vocabulary.map((vocab, index) => (
              <View key={index} className="bg-surface rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Text className="text-foreground text-lg font-semibold">{vocab.word}</Text>
                  <Text className="text-muted text-sm ml-2">({vocab.partOfSpeech})</Text>
                </View>
                <Text className="text-muted text-sm mb-2">{vocab.pronunciation}</Text>
                <Text className="text-foreground text-sm mb-2">{vocab.definition}</Text>
                <Text className="text-muted text-sm italic">"{vocab.example}"</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 bg-background border-t border-border pt-4">
        <TouchableOpacity
          onPress={handleStartPractice}
          className="bg-primary rounded-full py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Start Practice</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
