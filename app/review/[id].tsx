import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Article, PracticeSession } from "@/types";
import { getArticleById, getSessionsByArticleId } from "@/lib/storage";

export default function ReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [latestSession, setLatestSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    
    const fetchedArticle = await getArticleById(id);
    setArticle(fetchedArticle);

    const sessions = await getSessionsByArticleId(id);
    if (sessions.length > 0) {
      // Get the most recent session
      const sorted = sessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLatestSession(sorted[0]);
    }

    setLoading(false);
  }

  function handlePracticeAgain() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (article) {
      router.push(`/practice/${article.id}` as any);
    }
  }

  function handleBackToHome() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/");
  }

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!article || !latestSession || !latestSession.feedback) {
    return (
      <ScreenContainer className="justify-center items-center px-4">
        <Text className="text-foreground text-xl font-semibold mb-2">No review available</Text>
        <TouchableOpacity
          onPress={handleBackToHome}
          className="bg-primary px-6 py-3 rounded-full mt-4"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Back to Home</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const { feedback, transcription } = latestSession;

  return (
    <ScreenContainer className="px-4 pt-4">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={handleBackToHome}
          className="mr-3 p-2"
          activeOpacity={0.7}
        >
          <Text className="text-primary text-lg">← Home</Text>
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-semibold">Review Results</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Overall Score */}
        <View className="bg-primary/10 rounded-2xl p-6 mb-4 items-center">
          <Text className="text-muted text-sm mb-2">Overall Score</Text>
          <Text className="text-primary text-6xl font-bold">{feedback.overallScore}</Text>
          <Text className="text-muted text-sm mt-2">out of 100</Text>
        </View>

        {/* Detailed Scores */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-foreground text-lg font-bold mb-3">Detailed Scores</Text>
          
          <ScoreItem
            label="Pronunciation"
            score={feedback.pronunciation.score}
            comment={feedback.pronunciation.comment}
          />
          <ScoreItem
            label="Intonation"
            score={feedback.intonation.score}
            comment={feedback.intonation.comment}
          />
          <ScoreItem
            label="Rhythm"
            score={feedback.rhythm.score}
            comment={feedback.rhythm.comment}
          />
          <ScoreItem
            label="Fluency"
            score={feedback.fluency.score}
            comment={feedback.fluency.comment}
          />
        </View>

        {/* Transcription */}
        {transcription && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-foreground text-lg font-bold mb-2">Your Speech</Text>
            <Text className="text-foreground text-base leading-relaxed">{transcription}</Text>
          </View>
        )}

        {/* Detailed Feedback */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-foreground text-lg font-bold mb-2">Detailed Feedback</Text>
          <Text className="text-foreground text-base leading-relaxed">{feedback.detailedFeedback}</Text>
        </View>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4">
            <Text className="text-foreground text-lg font-bold mb-3">✓ Your Strengths</Text>
            {feedback.strengths.map((strength, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-success font-bold mr-2">•</Text>
                <Text className="text-foreground text-base flex-1">{strength}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Word Level Analysis */}
        {feedback.wordLevelAnalysis && feedback.wordLevelAnalysis.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-foreground text-lg font-bold mb-3">Word-Level Analysis</Text>
            {feedback.wordLevelAnalysis.map((item, index) => (
              <View key={index} className="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                <Text className="text-primary text-base font-bold mb-1">{item.word}</Text>
                <View className="mb-2">
                  <Text className="text-muted text-sm">Issue:</Text>
                  <Text className="text-foreground text-sm ml-2">{item.issue}</Text>
                </View>
                <View className="mb-2">
                  <Text className="text-muted text-sm">Suggestion:</Text>
                  <Text className="text-foreground text-sm ml-2">{item.suggestion}</Text>
                </View>
                <View>
                  <Text className="text-muted text-sm">Correct Pronunciation:</Text>
                  <Text className="text-primary text-sm ml-2 font-semibold">{item.example}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Improvements */}
        {feedback.improvements && feedback.improvements.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-foreground text-lg font-bold mb-3">Areas for Improvement</Text>
            {feedback.improvements.map((item, index) => (
              <View key={index} className="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                <Text className="text-primary text-base font-bold mb-2">{item.area}</Text>
                <View className="mb-2">
                  <Text className="text-muted text-sm">Current:</Text>
                  <Text className="text-foreground text-sm ml-2">{item.current}</Text>
                </View>
                <View className="mb-2">
                  <Text className="text-muted text-sm">Target:</Text>
                  <Text className="text-success text-sm ml-2 font-semibold">{item.target}</Text>
                </View>
                <View>
                  <Text className="text-muted text-sm">Practice Method:</Text>
                  <Text className="text-foreground text-sm ml-2">{item.practice}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-foreground text-lg font-bold mb-3">Quick Tips</Text>
            {feedback.suggestions.map((suggestion, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-primary font-bold mr-2">{index + 1}.</Text>
                <Text className="text-foreground text-base flex-1">{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 bg-background border-t border-border pt-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handlePracticeAgain}
            className="flex-1 bg-surface border border-border rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-foreground text-base font-bold">Practice Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBackToHome}
            className="flex-1 bg-primary rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">Next Article</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

function ScoreItem({ label, score, comment }: { label: string; score: number; comment: string }) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-foreground text-base font-semibold">{label}</Text>
        <Text className="text-primary text-lg font-bold">{score}</Text>
      </View>
      <View className="h-2 bg-background rounded-full overflow-hidden mb-2">
        <View
          className="h-full bg-primary"
          style={{ width: `${score}%` }}
        />
      </View>
      <Text className="text-muted text-sm">{comment}</Text>
    </View>
  );
}
