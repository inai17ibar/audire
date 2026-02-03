import React, { useCallback, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AudioCard } from "@/components/audio-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudio } from "@/lib/audio-context";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { posts, toggleLike } = useAudio();
  const { user, mode, logout } = useAppAuth();
  const { settings, updateSettings, triggerHaptic, announce } = useAccessibility();

  // Filter user's posts
  const userPosts = posts.filter(p => p.userId === user?.id);

  // Announce screen on mount
  useEffect(() => {
    const name = user?.name || "ゲスト";
    announce(`プロフィール画面です。${name}さん。${userPosts.length}件の投稿があります。`);
  }, [announce, user, userPosts.length]);

  const handleLogout = useCallback(async () => {
    triggerHaptic("medium");
    await logout();
    announce("ログアウトしました");
    router.replace("/(auth)/welcome" as any);
  }, [logout, triggerHaptic, announce, router]);

  const handleLogin = useCallback(() => {
    triggerHaptic("light");
    router.push("/(auth)/login" as any);
  }, [triggerHaptic, router]);

  // Generate initials for avatar
  const initials = user?.name?.slice(0, 2) || "ゲス";

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
            プロフィール
          </Text>
        </View>

        {/* User Info */}
        <View className="items-center px-4 pb-6">
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground mt-4">
            {user?.name || "ゲストユーザー"}
          </Text>
          {user?.email && (
            <Text className="text-base text-muted mt-1">{user.email}</Text>
          )}
          {mode === "guest" && (
            <View className="bg-warning/10 rounded-full px-4 py-2 mt-2">
              <Text className="text-warning text-sm font-medium">ゲストモード</Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row gap-8 mt-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">
                {userPosts.length}
              </Text>
              <Text className="text-sm text-muted">投稿</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">0</Text>
              <Text className="text-sm text-muted">フォロワー</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">0</Text>
              <Text className="text-sm text-muted">フォロー中</Text>
            </View>
          </View>
        </View>

        {/* Guest Mode: Login Prompt */}
        {mode === "guest" && (
          <View className="mx-4 mb-6 bg-surface rounded-2xl p-6">
            <Text className="text-lg font-semibold text-foreground text-center mb-2">
              アカウントを作成しよう
            </Text>
            <Text className="text-base text-muted text-center mb-4">
              ログインすると、投稿やフォロー機能が使えます
            </Text>
            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessible
              accessibilityLabel="ログイン"
              accessibilityRole="button"
            >
              <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
            </Pressable>
          </View>
        )}

        {/* Accessibility Settings */}
        <View className="mx-4 mb-6">
          <Text
            className="text-lg font-semibold text-foreground mb-3"
            accessible
            accessibilityRole="header"
          >
            アクセシビリティ設定
          </Text>

          <View className="bg-surface rounded-2xl overflow-hidden">
            {/* Auto Play Feed */}
            <SettingRow
              icon="play.fill"
              title="フィード自動再生"
              description="タイムラインの音声を自動で再生"
              value={settings.autoPlayFeed}
              onValueChange={(value) => {
                updateSettings({ autoPlayFeed: value });
                announce(value ? "自動再生をオンにしました" : "自動再生をオフにしました");
              }}
            />

            {/* Haptic Feedback */}
            <SettingRow
              icon="hand.raised.fill"
              title="触覚フィードバック"
              description="操作時に振動でフィードバック"
              value={settings.hapticFeedback}
              onValueChange={(value) => {
                updateSettings({ hapticFeedback: value });
                announce(value ? "触覚フィードバックをオンにしました" : "触覚フィードバックをオフにしました");
              }}
            />

            {/* Screen Change Announcements */}
            <SettingRow
              icon="bell.fill"
              title="画面変更の読み上げ"
              description="画面が変わった時に通知"
              value={settings.announceScreenChanges}
              onValueChange={(value) => {
                updateSettings({ announceScreenChanges: value });
                announce(value ? "画面変更の読み上げをオンにしました" : "画面変更の読み上げをオフにしました");
              }}
              isLast
            />
          </View>
        </View>

        {/* Playback Speed */}
        <View className="mx-4 mb-6">
          <Text
            className="text-lg font-semibold text-foreground mb-3"
            accessible
            accessibilityRole="header"
          >
            再生速度
          </Text>
          <View className="flex-row gap-2">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <Pressable
                key={speed}
                onPress={() => {
                  triggerHaptic("light");
                  updateSettings({ playbackSpeed: speed });
                  announce(`再生速度を${speed}倍に設定しました`);
                }}
                style={({ pressed }) => [
                  styles.speedButton,
                  {
                    backgroundColor: settings.playbackSpeed === speed
                      ? colors.primary
                      : colors.surface,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                accessible
                accessibilityLabel={`${speed}倍速`}
                accessibilityState={{ selected: settings.playbackSpeed === speed }}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    {
                      color: settings.playbackSpeed === speed
                        ? "#FFFFFF"
                        : colors.foreground,
                    },
                  ]}
                >
                  {speed}x
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* My Posts */}
        {userPosts.length > 0 && (
          <View className="mb-6">
            <Text
              className="text-lg font-semibold text-foreground px-4 mb-3"
              accessible
              accessibilityRole="header"
            >
              あなたの投稿
            </Text>
            <View className="px-4">
              {userPosts.map((post) => (
                <AudioCard
                  key={post.id}
                  post={post}
                  onLike={() => toggleLike(post.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Logout Button */}
        <View className="mx-4 mb-8">
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              { borderColor: colors.error },
              pressed && { opacity: 0.8 },
            ]}
            accessible
            accessibilityLabel="ログアウト"
            accessibilityRole="button"
          >
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>
              ログアウト
            </Text>
          </Pressable>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  isLast = false,
}: {
  icon: "play.fill" | "hand.raised.fill" | "bell.fill";
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  const colors = useColors();

  return (
    <View
      className={`flex-row items-center px-4 py-4 ${!isLast ? "border-b border-border" : ""}`}
      accessible
      accessibilityLabel={`${title}。${description}。${value ? "オン" : "オフ"}`}
      accessibilityRole="switch"
    >
      <IconSymbol name={icon} size={24} color={colors.primary} />
      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  speedButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  speedButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
