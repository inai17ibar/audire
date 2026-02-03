import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility";

// Voice commands supported by the agent
export type VoiceCommand =
  | "record_start"
  | "record_stop"
  | "play"
  | "pause"
  | "next"
  | "previous"
  | "like"
  | "follow"
  | "home"
  | "discover"
  | "stories"
  | "profile"
  | "settings"
  | "help";

interface VoiceAgentProps {
  visible: boolean;
  onClose: () => void;
  onCommand: (command: VoiceCommand) => void;
}

// Command definitions with Japanese phrases
const VOICE_COMMANDS: { command: VoiceCommand; phrases: string[]; description: string }[] = [
  { command: "record_start", phrases: ["録音開始", "録音して", "録音"], description: "録音を開始" },
  { command: "record_stop", phrases: ["録音停止", "止めて", "ストップ"], description: "録音を停止" },
  { command: "play", phrases: ["再生", "再生して", "プレイ"], description: "音声を再生" },
  { command: "pause", phrases: ["一時停止", "止めて", "ポーズ"], description: "再生を一時停止" },
  { command: "next", phrases: ["次", "次へ", "スキップ"], description: "次の音声へ" },
  { command: "previous", phrases: ["前", "前へ", "戻る"], description: "前の音声へ" },
  { command: "like", phrases: ["いいね", "ライク", "お気に入り"], description: "いいねを追加" },
  { command: "follow", phrases: ["フォロー", "フォローする"], description: "ユーザーをフォロー" },
  { command: "home", phrases: ["ホーム", "ホームに戻る", "タイムライン"], description: "ホーム画面へ" },
  { command: "discover", phrases: ["発見", "探す", "検索"], description: "発見画面へ" },
  { command: "stories", phrases: ["ストーリー", "日記"], description: "ストーリー画面へ" },
  { command: "profile", phrases: ["プロフィール", "マイページ"], description: "プロフィール画面へ" },
  { command: "settings", phrases: ["設定", "セッティング"], description: "設定を開く" },
  { command: "help", phrases: ["ヘルプ", "助けて", "使い方"], description: "ヘルプを表示" },
];

export function VoiceAgent({ visible, onClose, onCommand }: VoiceAgentProps) {
  const colors = useColors();
  const { triggerHaptic, announce } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Animation for listening indicator
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0.5, { duration: 200 });
    }
  }, [isListening, pulseScale, pulseOpacity]);

  // Announce when modal opens
  useEffect(() => {
    if (visible) {
      announce("音声エージェントです。マイクボタンを押して話しかけてください。ヘルプボタンで使えるコマンドを確認できます。");
    }
  }, [visible, announce]);

  // Start listening (simulated - in real app, use speech recognition)
  const startListening = useCallback(() => {
    triggerHaptic("medium");
    setIsListening(true);
    setRecognizedText("");
    announce("聞いています。コマンドを話してください。");

    // Simulate speech recognition (in real app, use expo-speech or native APIs)
    // For demo, we'll simulate after a delay
    setTimeout(() => {
      // Simulate recognized text
      const simulatedCommands = ["ホーム", "再生", "いいね", "ストーリー"];
      const randomCommand = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
      setRecognizedText(randomCommand);
      setIsListening(false);

      // Find matching command
      const matchedCommand = VOICE_COMMANDS.find(cmd =>
        cmd.phrases.some(phrase => phrase.includes(randomCommand) || randomCommand.includes(phrase))
      );

      if (matchedCommand) {
        triggerHaptic("success");
        announce(`${matchedCommand.description}を実行します`);
        onCommand(matchedCommand.command);
        setTimeout(() => onClose(), 1000);
      } else {
        triggerHaptic("error");
        announce("コマンドを認識できませんでした。もう一度お試しください。");
      }
    }, 2000);
  }, [triggerHaptic, announce, onCommand, onClose]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    triggerHaptic("light");
    announce("聞き取りを停止しました");
  }, [triggerHaptic, announce]);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleClose = useCallback(() => {
    triggerHaptic("light");
    onClose();
  }, [triggerHaptic, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Text
            className="text-xl font-bold text-foreground"
            accessible
            accessibilityRole="header"
          >
            音声エージェント
          </Text>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7 },
            ]}
            accessible
            accessibilityLabel="閉じる"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {showHelp ? (
          // Help view
          <View className="flex-1 px-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              使えるコマンド
            </Text>
            {VOICE_COMMANDS.map((cmd) => (
              <View
                key={cmd.command}
                className="flex-row items-center py-3 border-b border-border"
                accessible
                accessibilityLabel={`${cmd.description}。「${cmd.phrases[0]}」と言ってください`}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {cmd.description}
                  </Text>
                  <Text className="text-sm text-muted">
                    「{cmd.phrases.join("」「")}」
                  </Text>
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => {
                triggerHaptic("light");
                setShowHelp(false);
              }}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9 },
              ]}
              accessible
              accessibilityLabel="戻る"
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>戻る</Text>
            </Pressable>
          </View>
        ) : (
          // Main voice interface
          <View className="flex-1 items-center justify-center px-6">
            {/* Status text */}
            <Text className="text-lg text-muted mb-8 text-center">
              {isListening
                ? "聞いています..."
                : recognizedText
                ? `認識: "${recognizedText}"`
                : "マイクボタンを押して話しかけてください"}
            </Text>

            {/* Microphone button with pulse */}
            <View style={styles.micContainer}>
              {isListening && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { borderColor: colors.primary },
                    pulseStyle,
                  ]}
                />
              )}
              <Pressable
                onPressIn={startListening}
                onPressOut={stopListening}
                style={({ pressed }) => [
                  styles.micButton,
                  {
                    backgroundColor: isListening ? colors.error : colors.primary,
                  },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                accessible
                accessibilityLabel={isListening ? "聞き取り中。離すと停止" : "長押しで音声入力"}
                accessibilityRole="button"
              >
                <IconSymbol
                  name={isListening ? "waveform" : "mic.fill"}
                  size={48}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            {/* Help button */}
            <Pressable
              onPress={() => {
                triggerHaptic("light");
                setShowHelp(true);
                announce("使えるコマンドの一覧を表示します");
              }}
              style={({ pressed }) => [
                styles.helpButton,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.8 },
              ]}
              accessible
              accessibilityLabel="使えるコマンドを見る"
              accessibilityRole="button"
            >
              <IconSymbol name="ear.fill" size={20} color={colors.primary} />
              <Text style={[styles.helpButtonText, { color: colors.foreground }]}>
                使えるコマンドを見る
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Floating button to trigger voice agent
export function VoiceAgentButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const { triggerHaptic } = useAccessibility();

  const handlePress = () => {
    triggerHaptic("light");
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.floatingButton,
        { backgroundColor: colors.primary },
        pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
      ]}
      accessible
      accessibilityLabel="音声エージェントを起動"
      accessibilityHint="音声コマンドでアプリを操作できます"
      accessibilityRole="button"
    >
      <IconSymbol name="mic.fill" size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  micContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  pulseRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  backButton: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
