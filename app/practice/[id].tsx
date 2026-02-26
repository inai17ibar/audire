import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { HighlightedText } from "@/components/highlighted-text";
import { InterleavedText } from "@/components/interleaved-text";
import { OfflineDownloadButton } from "@/components/offline-download-button";
import { AudioSeekbar } from "@/components/audio-seekbar";
import { Article, ScriptDisplayMode, PlaybackSpeed } from "@/types";
import { getArticleById, savePracticeSession } from "@/lib/storage";
import { useAudioPractice } from "@/hooks/use-audio-practice";
import { trpc } from "@/lib/trpc";
import { updateArticleAudioCache } from "@/lib/audio-cache";

const playbackSpeeds: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];
const scriptModes: { mode: ScriptDisplayMode; label: string }[] = [
  { mode: "english-only", label: "English" },
  { mode: "english-japanese", label: "EN + JP" },
  { mode: "hidden", label: "Hidden" },
];

export default function PracticeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptMode, setScriptMode] = useState<ScriptDisplayMode>("english-only");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewProgress, setReviewProgress] = useState<{
    step: "uploading" | "transcribing" | "analyzing" | null;
    message: string;
  }>({ step: null, message: "" });

  const audio = useAudioPractice(
    article?.content || "",
    article?.audioUrl,
    article?.audioCachedAt
  );
  const pronunciationReviewMutation = trpc.pronunciation.review.useMutation();
  const uploadAudioMutation = trpc.audio.upload.useMutation();

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    if (!id) return;
    setLoading(true);
    const fetchedArticle = await getArticleById(id);
    setArticle(fetchedArticle);
    setLoading(false);
  }

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  async function handlePlayPause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (audio.isPlaying) {
      audio.pause();
    } else {
      // Generate audio if not cached
      if (!audio.audioUrl && article) {
        const result = await audio.generateAudio();
        if (result && article.id) {
          // Save audio cache to article
          await updateArticleAudioCache(
            article.id,
            result.audioUrl,
            result.audioCachedAt
          );
          // Reload article to get updated cache
          await loadArticle();
        }
      }
      audio.play();
    }
  }

  function handleSpeedChange() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = playbackSpeeds.indexOf(audio.playbackSpeed);
    const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
    audio.changeSpeed(playbackSpeeds[nextIndex]);
  }

  function handleScriptModeChange() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = scriptModes.findIndex((m) => m.mode === scriptMode);
    const nextIndex = (currentIndex + 1) % scriptModes.length;
    setScriptMode(scriptModes[nextIndex].mode);
  }

  async function handleRecordToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (audio.isRecording) {
      const uri = await audio.stopRecording();
      if (uri && article) {
        // Submit for review
        await submitForReview(uri);
      }
    } else {
      audio.startRecording();
    }
  }

  async function submitForReview(recordingUri: string) {
    if (!article) return;

    setIsSubmittingReview(true);
    try {
      // Step 1: Upload recording to S3
      setReviewProgress({ step: "uploading", message: "録音をアップロード中..." });
      
      const response = await fetch(recordingUri);
      const blob = await response.blob();
      
      // Convert blob to base64 for upload
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadResult = await uploadAudioMutation.mutateAsync({
        audioData: base64Audio,
        mimeType: blob.type || 'audio/mp4',
      });
      
      const audioUrl = uploadResult.url;

      // Step 2: Transcribe and analyze
      setReviewProgress({ step: "transcribing", message: "音声を文字起こし中..." });
      
      const result = await pronunciationReviewMutation.mutateAsync({
        audioUrl,
        originalText: article.content,
        language: "en",
      });

      // Step 3: Analyzing
      setReviewProgress({ step: "analyzing", message: "AIが発音を分析中..." });

      // Save practice session
      await savePracticeSession({
        id: Date.now().toString(),
        articleId: article.id,
        recordingUrl: recordingUri,
        transcription: result.transcription,
        feedback: result.feedback,
        score: result.feedback.overallScore,
        createdAt: new Date().toISOString(),
      });

      // Navigate to review screen
      router.push(`/review/${article.id}` as any);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit recording for review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
      setReviewProgress({ step: null, message: "" });
    }
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
        <Text className="text-foreground text-xl font-semibold">Article not found</Text>
      </ScreenContainer>
    );
  }

  const currentScriptModeLabel =
    scriptModes.find((m) => m.mode === scriptMode)?.label || "English";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScreenContainer className="px-4 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={handleBack} className="p-2" activeOpacity={0.7}>
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-foreground text-base font-semibold flex-1 text-center" numberOfLines={1}>
          {article.title}
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 250 }}>
        {audio.isGeneratingAudio && (
          <View className="bg-surface rounded-2xl p-6 mb-4 items-center">
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text className="text-muted text-sm mt-2">Generating audio...</Text>
          </View>
        )}

        {/* Offline Download Button */}
        {article && (audio.audioUrl || article.localAudioPath) && (
          <View className="mb-4 items-center">
            <OfflineDownloadButton
              article={article}
              onDownloadComplete={loadArticle}
            />
          </View>
        )}

        {scriptMode !== "hidden" && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground text-base font-semibold">Script</Text>
              <TouchableOpacity
                onPress={handleScriptModeChange}
                className="bg-primary/10 px-3 py-1 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-primary text-sm font-medium">{currentScriptModeLabel}</Text>
              </TouchableOpacity>
            </View>
            {scriptMode === "english-only" && (
              <HighlightedText
                text={article.content}
                currentTime={audio.currentTime}
                duration={audio.duration}
              />
            )}
            {scriptMode === "english-japanese" && (
              <View>
                {article.translation ? (
                  <InterleavedText
                    englishText={article.content}
                    japaneseText={article.translation}
                    currentTime={audio.currentTime}
                    duration={audio.duration}
                  />
                ) : (
                  <HighlightedText
                    text={article.content}
                    currentTime={audio.currentTime}
                    duration={audio.duration}
                    className="mb-3"
                  />
                )}
              </View>
            )}
          </View>
        )}

        {scriptMode === "hidden" && (
          <View className="bg-surface rounded-2xl p-8 mb-4 items-center justify-center" style={{ minHeight: 200 }}>
            <Text className="text-muted text-base mb-4">Script is hidden</Text>
            <TouchableOpacity
              onPress={handleScriptModeChange}
              className="bg-primary px-4 py-2 rounded-full"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium">Show Script</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 bg-background border-t border-border pt-4">
        {audio.duration > 0 && (
          <AudioSeekbar
            currentTime={audio.currentTime}
            duration={audio.duration}
            onSeek={audio.seekTo}
            className="mb-3"
          />
        )}

        <View className="flex-row items-center justify-center mb-4 gap-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              audio.seekBy(-10);
            }}
            className="bg-surface p-3 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            className="bg-primary p-4 rounded-full"
            activeOpacity={0.8}
            disabled={audio.isGeneratingAudio}
          >
            <Text className="text-white text-lg font-bold">{audio.isPlaying ? "⏸" : "▶"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              audio.seekBy(10);
            }}
            className="bg-surface p-3 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">+10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSpeedChange}
            className="bg-surface px-3 py-2 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">{audio.playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {isSubmittingReview && reviewProgress.step && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground text-sm font-medium">{reviewProgress.message}</Text>
              <View className="flex-row gap-1">
                <View className={`w-2 h-2 rounded-full ${
                  reviewProgress.step === "uploading" ? "bg-primary" : "bg-surface"
                }`} />
                <View className={`w-2 h-2 rounded-full ${
                  reviewProgress.step === "transcribing" ? "bg-primary" : "bg-surface"
                }`} />
                <View className={`w-2 h-2 rounded-full ${
                  reviewProgress.step === "analyzing" ? "bg-primary" : "bg-surface"
                }`} />
              </View>
            </View>
            <View className="h-1 bg-surface rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{
                  width: reviewProgress.step === "uploading" ? "33%" :
                         reviewProgress.step === "transcribing" ? "66%" : "100%"
                }}
              />
            </View>
          </View>
        )}

        {/* Recording Playback Button */}
        {audio.recordingUri && !audio.isRecording && !isSubmittingReview && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (audio.isPlayingRecording) {
                audio.pauseRecording();
              } else {
                audio.playRecording();
              }
            }}
            className="bg-surface rounded-full py-3 items-center mb-3 flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            <Text className="text-foreground text-base font-bold">
              {audio.isPlayingRecording ? "⏸ 録音を一時停止" : "▶ 録音を再生"}
            </Text>
            {audio.recordingDuration > 0 && (
              <Text className="text-muted text-sm">
                ({Math.floor(audio.recordingCurrentTime)}s / {Math.floor(audio.recordingDuration)}s)
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleRecordToggle}
          className={`rounded-full py-4 items-center ${
            audio.isRecording ? "bg-error" : "bg-primary"
          }`}
          activeOpacity={0.8}
          disabled={isSubmittingReview}
        >
          {isSubmittingReview ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-bold">
              {audio.isRecording ? "⏹ Stop & Review" : "⏺ Start Recording"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
