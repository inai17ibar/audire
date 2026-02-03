import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { mode, isLoading, loginAsGuest } = useAppAuth();
  const { triggerHaptic, announce } = useAccessibility();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && mode !== "none") {
      router.replace("/(tabs)");
    }
  }, [mode, isLoading, router]);

  // Announce screen on mount
  useEffect(() => {
    announce("Audireへようこそ。音声でつながるSNSアプリです。ログイン、新規登録、またはゲストモードを選択してください。");
  }, [announce]);

  const handleLogin = () => {
    triggerHaptic("light");
    router.push("/(auth)/login" as any);
  };

  const handleRegister = () => {
    triggerHaptic("light");
    router.push("/(auth)/register" as any);
  };

  const handleGuestMode = async () => {
    triggerHaptic("medium");
    await loginAsGuest();
    router.replace("/(tabs)");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-6">
      <View className="flex-1 justify-center items-center">
        {/* Logo and App Name */}
        <View
          style={[styles.logoContainer, { backgroundColor: colors.primary }]}
          accessible
          accessibilityLabel="Audireロゴ"
          accessibilityRole="image"
        >
          <IconSymbol name="waveform" size={48} color="#FFFFFF" />
        </View>

        <Text
          className="text-4xl font-bold text-foreground mt-6"
          accessible
          accessibilityRole="header"
        >
          Audire
        </Text>

        <Text
          className="text-lg text-muted text-center mt-2 leading-7"
          accessible
          accessibilityRole="text"
        >
          音声でつながる、新しいSNS
        </Text>

        {/* Features */}
        <View className="mt-8 w-full max-w-sm">
          <FeatureItem
            icon="mic.fill"
            title="音声を録音・共有"
            description="あなたの声を世界に届けよう"
          />
          <FeatureItem
            icon="ear.fill"
            title="VoiceOver対応"
            description="視覚障がい者の方も快適に利用可能"
          />
          <FeatureItem
            icon="antenna.radiowaves.left.and.right"
            title="ライブ配信"
            description="リアルタイムで音声を共有"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className="w-full pb-8">
        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessible
          accessibilityLabel="ログイン"
          accessibilityHint="既存のアカウントでログインします"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>ログイン</Text>
        </Pressable>

        {/* Register Button */}
        <Pressable
          onPress={handleRegister}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessible
          accessibilityLabel="新規登録"
          accessibilityHint="新しいアカウントを作成します"
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            新規登録
          </Text>
        </Pressable>

        {/* Guest Mode */}
        <Pressable
          onPress={handleGuestMode}
          style={({ pressed }) => [
            styles.textButton,
            pressed && { opacity: 0.7 },
          ]}
          accessible
          accessibilityLabel="ゲストとして続ける"
          accessibilityHint="アカウントなしで閲覧のみ可能なモードで利用します"
          accessibilityRole="button"
        >
          <Text className="text-base text-muted">ゲストとして続ける</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: "mic.fill" | "ear.fill" | "antenna.radiowaves.left.and.right";
  title: string;
  description: string;
}) {
  const colors = useColors();

  return (
    <View
      className="flex-row items-center py-3"
      accessible
      accessibilityLabel={`${title}。${description}`}
      accessibilityRole="text"
    >
      <View
        style={[styles.featureIcon, { backgroundColor: colors.surface }]}
      >
        <IconSymbol name={icon} size={24} color={colors.primary} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  textButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
