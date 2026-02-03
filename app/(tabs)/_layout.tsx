import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, isLoading } = useAppAuth();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!isLoading && mode === "none") {
      router.replace("/(auth)/welcome" as any);
    }
  }, [mode, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          tabBarAccessibilityLabel: "ホーム。タイムラインを表示します",
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "発見",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="compass.fill" color={color} />,
          tabBarAccessibilityLabel: "発見。トレンドやおすすめを表示します",
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "録音",
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="mic.fill" color={color} />,
          tabBarAccessibilityLabel: "録音。新しい音声を録音して投稿します",
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: "ストーリー",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          tabBarAccessibilityLabel: "ストーリー。24時間で消える音声日記を表示します",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          tabBarAccessibilityLabel: "プロフィール。あなたの投稿と設定を表示します",
        }}
      />
    </Tabs>
  );
}
