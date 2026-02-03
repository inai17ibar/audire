import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RecordButton } from "@/components/record-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudio, type SoundEffect, type BGMTrack } from "@/lib/audio-context";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";

export default function RecordScreen() {
  const router = useRouter();
  const colors = useColors();
  const { soundEffects, bgmTracks, addPost } = useAudio();
  const { user, mode } = useAppAuth();
  const { triggerHaptic, announce } = useAccessibility();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<SoundEffect | null>(null);
  const [selectedBGM, setSelectedBGM] = useState<BGMTrack | null>(null);
  const [isStory, setIsStory] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  // Announce screen on mount
  useEffect(() => {
    announce("録音画面です。中央のボタンを長押しして録音を開始してください。");
  }, [announce]);

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setHasRecording(false);
    announce("録音を開始しました");
  }, [announce]);

  const handleRecordingStop = useCallback((duration: number) => {
    setIsRecording(false);
    setRecordedDuration(duration);
    setHasRecording(true);
    announce(`${duration}秒間録音しました。投稿するか、エフェクトを追加できます。`);
  }, [announce]);

  const handlePost = useCallback(async () => {
    if (!hasRecording) return;

    triggerHaptic("success");

    await addPost({
      userId: user?.id || "guest",
      userName: user?.name || "ゲスト",
      audioUri: "", // In real app, this would be the recorded audio URI
      duration: recordedDuration,
      caption: "",
      isStory,
      soundEffect: selectedEffect?.id,
      bgmTrack: selectedBGM?.id,
    });

    announce(isStory ? "ストーリーを投稿しました" : "音声を投稿しました");
    
    // Reset state
    setHasRecording(false);
    setRecordedDuration(0);
    setSelectedEffect(null);
    setSelectedBGM(null);
    setIsStory(false);

    // Navigate to home
    router.push("/(tabs)" as any);
  }, [hasRecording, user, recordedDuration, isStory, selectedEffect, selectedBGM, addPost, triggerHaptic, announce, router]);

  const handleDiscard = useCallback(() => {
    triggerHaptic("light");
    setHasRecording(false);
    setRecordedDuration(0);
    setSelectedEffect(null);
    setSelectedBGM(null);
    announce("録音を破棄しました");
  }, [triggerHaptic, announce]);

  const toggleEffectSelection = useCallback((effect: SoundEffect) => {
    triggerHaptic("light");
    if (selectedEffect?.id === effect.id) {
      setSelectedEffect(null);
      announce(`${effect.name}を解除しました`);
    } else {
      setSelectedEffect(effect);
      announce(`${effect.name}を選択しました`);
    }
  }, [selectedEffect, triggerHaptic, announce]);

  const toggleBGMSelection = useCallback((bgm: BGMTrack) => {
    triggerHaptic("light");
    if (selectedBGM?.id === bgm.id) {
      setSelectedBGM(null);
      announce(`${bgm.name}を解除しました`);
    } else {
      setSelectedBGM(bgm);
      announce(`${bgm.name}を選択しました`);
    }
  }, [selectedBGM, triggerHaptic, announce]);

  // Check if guest mode
  const isGuest = mode === "guest";

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="py-4">
          <Text
            className="text-2xl font-bold text-foreground text-center"
            accessible
            accessibilityRole="header"
          >
            {hasRecording ? "プレビュー" : "録音"}
          </Text>
        </View>

        {/* Guest Mode Warning */}
        {isGuest && (
          <View
            className="bg-warning/10 rounded-xl p-4 mb-4"
            accessible
            accessibilityRole="alert"
          >
            <Text className="text-warning text-center">
              ゲストモードでは投稿できません。ログインしてください。
            </Text>
          </View>
        )}

        {/* Recording Area */}
        <View className="flex-1 items-center justify-center py-8">
          <RecordButton
            onRecordingStart={handleRecordingStart}
            onRecordingStop={handleRecordingStop}
            isRecording={isRecording}
            disabled={isGuest || hasRecording}
          />
        </View>

        {/* Post Options (shown after recording) */}
        {hasRecording && (
          <View className="mb-8">
            {/* Story Toggle */}
            <View
              className="flex-row items-center justify-between bg-surface rounded-xl p-4 mb-4"
              accessible
              accessibilityLabel={`ストーリーとして投稿。${isStory ? "オン" : "オフ"}`}
              accessibilityRole="switch"
            >
              <View className="flex-row items-center">
                <IconSymbol name="clock.fill" size={24} color={colors.primary} />
                <View className="ml-3">
                  <Text className="text-base font-medium text-foreground">
                    ストーリーとして投稿
                  </Text>
                  <Text className="text-sm text-muted">
                    24時間後に自動削除されます
                  </Text>
                </View>
              </View>
              <Switch
                value={isStory}
                onValueChange={(value) => {
                  setIsStory(value);
                  announce(value ? "ストーリーとして投稿します" : "通常投稿に変更しました");
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Effects Toggle */}
            <Pressable
              onPress={() => {
                triggerHaptic("light");
                setShowEffects(!showEffects);
              }}
              style={({ pressed }) => [
                pressed && { opacity: 0.8 },
              ]}
              className="flex-row items-center justify-between bg-surface rounded-xl p-4 mb-4"
              accessible
              accessibilityLabel="エフェクトを追加"
              accessibilityHint="タップしてサウンドエフェクトやBGMを選択します"
              accessibilityRole="button"
            >
              <View className="flex-row items-center">
                <IconSymbol name="waveform" size={24} color={colors.primary} />
                <Text className="text-base font-medium text-foreground ml-3">
                  エフェクトを追加
                </Text>
              </View>
              <IconSymbol
                name={showEffects ? "chevron.left" : "chevron.right"}
                size={20}
                color={colors.muted}
              />
            </Pressable>

            {/* Effects Selection */}
            {showEffects && (
              <View className="mb-4">
                {/* Sound Effects */}
                <Text className="text-sm font-medium text-muted mb-2">
                  サウンドエフェクト
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  {soundEffects.map((effect) => (
                    <Pressable
                      key={effect.id}
                      onPress={() => toggleEffectSelection(effect)}
                      style={({ pressed }) => [
                        styles.effectButton,
                        {
                          backgroundColor: selectedEffect?.id === effect.id
                            ? colors.primary
                            : colors.surface,
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                      accessible
                      accessibilityLabel={effect.name}
                      accessibilityState={{ selected: selectedEffect?.id === effect.id }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.effectIcon}>{effect.icon}</Text>
                      <Text
                        style={[
                          styles.effectName,
                          {
                            color: selectedEffect?.id === effect.id
                              ? "#FFFFFF"
                              : colors.foreground,
                          },
                        ]}
                      >
                        {effect.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* BGM Tracks */}
                <Text className="text-sm font-medium text-muted mb-2">
                  BGM
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {bgmTracks.map((bgm) => (
                    <Pressable
                      key={bgm.id}
                      onPress={() => toggleBGMSelection(bgm)}
                      style={({ pressed }) => [
                        styles.bgmButton,
                        {
                          backgroundColor: selectedBGM?.id === bgm.id
                            ? colors.primary
                            : colors.surface,
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                      accessible
                      accessibilityLabel={`${bgm.name}、${bgm.artist}`}
                      accessibilityState={{ selected: selectedBGM?.id === bgm.id }}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.bgmName,
                          {
                            color: selectedBGM?.id === bgm.id
                              ? "#FFFFFF"
                              : colors.foreground,
                          },
                        ]}
                      >
                        {bgm.name}
                      </Text>
                      <Text
                        style={[
                          styles.bgmArtist,
                          {
                            color: selectedBGM?.id === bgm.id
                              ? "rgba(255,255,255,0.8)"
                              : colors.muted,
                          },
                        ]}
                      >
                        {bgm.artist}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-4 mt-4">
              <Pressable
                onPress={handleDiscard}
                style={({ pressed }) => [
                  styles.discardButton,
                  { borderColor: colors.error },
                  pressed && { opacity: 0.8 },
                ]}
                accessible
                accessibilityLabel="破棄"
                accessibilityHint="録音を破棄します"
                accessibilityRole="button"
              >
                <Text style={[styles.discardButtonText, { color: colors.error }]}>
                  破棄
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePost}
                disabled={isGuest}
                style={({ pressed }) => [
                  styles.postButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  isGuest && { opacity: 0.5 },
                ]}
                accessible
                accessibilityLabel="投稿"
                accessibilityHint="録音した音声を投稿します"
                accessibilityRole="button"
                accessibilityState={{ disabled: isGuest }}
              >
                <Text style={styles.postButtonText}>投稿する</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  effectButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 80,
  },
  effectIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  effectName: {
    fontSize: 12,
    fontWeight: "500",
  },
  bgmButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 120,
  },
  bgmName: {
    fontSize: 14,
    fontWeight: "600",
  },
  bgmArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  discardButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  postButton: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
