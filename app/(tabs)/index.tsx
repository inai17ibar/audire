import { useEffect, useState } from "react";
import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { Article, ArticleCategory } from "@/types";
import { getArticles, saveArticles, saveArticle } from "@/lib/storage";
import { sampleArticles } from "@/data/sample-articles";
import { trpc } from "@/lib/trpc";

const categories: ArticleCategory[] = [
  "Business & Politics",
  "Science & Technology",
  "Health & Lifestyle",
  "Culture & Society",
  "Travel & Experiences",
];

const levels = [
  { value: "All" as const, label: "All Levels" },
  { value: 1, label: "Level 1" },
  { value: 2, label: "Level 2" },
  { value: 3, label: "Level 3" },
  { value: 4, label: "Level 4" },
  { value: 5, label: "Level 5" },
  { value: 6, label: "Level 6" },
  { value: 7, label: "Level 7" },
  { value: 8, label: "Level 8" },
  { value: 9, label: "Level 9" },
  { value: 10, label: "Level 10" },
];

export default function HomeScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "All">("All");
  const [selectedLevel, setSelectedLevel] = useState<number | "All">("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  // Reload articles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [])
  );

  async function loadArticles() {
    setLoading(true);
    let storedArticles = await getArticles();
    
    // If no articles in storage, use sample articles
    if (storedArticles.length === 0) {
      storedArticles = sampleArticles;
      await saveArticles(sampleArticles);
    } else {
      // Check if stored articles have translation field
      const hasTranslation = storedArticles.every(article => article.translation !== undefined);
      
      // If any article is missing translation, update with sample articles
      if (!hasTranslation) {
        console.log("Updating articles with translations...");
        // Merge stored articles with sample articles to preserve any user data
        storedArticles = storedArticles.map(stored => {
          const sample = sampleArticles.find(s => s.id === stored.id);
          if (sample) {
            return { ...stored, translation: sample.translation };
          }
          return stored;
        });
        await saveArticles(storedArticles);
      }
    }
    
    setArticles(storedArticles);
    setLoading(false);
  }

  async function fetchArticlesFromServer() {
    setRefreshing(true);
    try {
      // Fetch articles from server using fetch API directly
      // Note: tRPC React hooks can't be used inside async functions
      const apiBaseUrl = "http://127.0.0.1:3000";
      const response = await fetch(`${apiBaseUrl}/api/trpc/articles.getArticles?input=${encodeURIComponent(JSON.stringify({ limit: 20, offset: 0, source: "all" }))}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.result?.data;
      
      if (result && result.length > 0) {
        // Convert server articles to app Article format
        const serverArticles: Article[] = result.map((serverArticle: any) => ({
          id: serverArticle.articleId,
          title: serverArticle.title,
          content: serverArticle.content,
          translation: serverArticle.translation || undefined,
          category: (serverArticle.category as ArticleCategory) || "Business & Politics",
          level: serverArticle.level || 6,
          publishedDate: serverArticle.publishedDate || new Date().toISOString().split("T")[0],
        }));
        
        // Save to local storage
        for (const article of serverArticles) {
          await saveArticle(article);
        }
        
        // Reload articles from storage
        await loadArticles();
      } else {
        console.log("No articles available from server");
      }
    } catch (error) {
      console.error("Error fetching articles from server:", error);
    } finally {
      setRefreshing(false);
    }
  }

  const filteredArticles = articles.filter((article) => {
    const categoryMatch = selectedCategory === "All" || article.category === selectedCategory;
    const levelMatch = selectedLevel === "All" || article.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  function handleCategoryPress(category: ArticleCategory | "All") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  }

  function handleLevelPress(level: number | "All") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLevel(level);
  }

  function handleArticlePress(article: Article) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/article/${article.id}` as any);
  }

  function renderArticleCard({ item }: { item: Article }) {
    return (
      <TouchableOpacity
        onPress={() => handleArticlePress(item)}
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-primary/10 px-3 py-1 rounded-full">
            <Text className="text-primary text-xs font-semibold">Level {item.level}</Text>
          </View>
          <Text className="text-muted text-xs">{item.publishedDate}</Text>
        </View>
        
        <Text className="text-foreground text-lg font-semibold mb-2" numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text className="text-muted text-sm mb-3" numberOfLines={2}>
          {item.content}
        </Text>
        
        <View className="flex-row items-center">
          <View className="bg-background px-3 py-1 rounded-full">
            <Text className="text-foreground text-xs">{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderCategoryButton(category: ArticleCategory | "All") {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        onPress={() => handleCategoryPress(category)}
        className={`px-4 py-2 rounded-full mr-2 ${
          isSelected ? "bg-primary" : "bg-surface border border-border"
        }`}
        activeOpacity={0.7}
      >
        <Text
          className={`text-sm font-medium ${
            isSelected ? "text-white" : "text-foreground"
          }`}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderLevelButton(level: { value: number | "All"; label: string }) {
    const isSelected = selectedLevel === level.value;
    return (
      <TouchableOpacity
        key={level.label}
        onPress={() => handleLevelPress(level.value)}
        className={`px-3 py-2 rounded-full mr-2 ${
          isSelected ? "bg-primary" : "bg-surface border border-border"
        }`}
        activeOpacity={0.7}
      >
        <Text
          className={`text-xs font-medium ${
            isSelected ? "text-white" : "text-foreground"
          }`}
        >
          {level.label}
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Loading articles...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-foreground mb-2">Shadow9</Text>
        <Text className="text-muted text-base">Practice English shadowing with daily news</Text>
      </View>

      <View className="mb-3">
        <Text className="text-foreground text-sm font-semibold mb-2">カテゴリ</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...categories]}
          renderItem={({ item }) => renderCategoryButton(item as ArticleCategory | "All")}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingRight: 16 }}
        />
      </View>

      <View className="mb-4">
        <Text className="text-foreground text-sm font-semibold mb-2">難易度</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={levels}
          renderItem={({ item }) => renderLevelButton(item)}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingRight: 16 }}
        />
      </View>

      <FlatList
        data={filteredArticles}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchArticlesFromServer}
            colors={["#0a7ea4"]}
            tintColor="#0a7ea4"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-muted text-base">No articles found</Text>
            <Text className="text-muted text-sm mt-2">Pull down to fetch articles from server</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
