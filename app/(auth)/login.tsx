import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useAppAuth();
  const { triggerHaptic, announce } = useAccessibility();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Announce screen on mount
  useEffect(() => {
    announce("ログイン画面です。メールアドレスとパスワードを入力してください。");
  }, [announce]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      triggerHaptic("error");
      announce("エラー。メールアドレスとパスワードを入力してください。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        triggerHaptic("success");
        announce("ログインに成功しました");
        router.replace("/(tabs)");
      } else {
        setError("ログインに失敗しました");
        triggerHaptic("error");
        announce("ログインに失敗しました。入力内容を確認してください。");
      }
    } catch (e) {
      setError("エラーが発生しました");
      triggerHaptic("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center py-4">
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && { opacity: 0.7 },
                ]}
                accessible
                accessibilityLabel="戻る"
                accessibilityRole="button"
              >
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Title */}
            <View className="mt-8">
              <Text
                className="text-3xl font-bold text-foreground"
                accessible
                accessibilityRole="header"
              >
                おかえりなさい
              </Text>
              <Text className="text-base text-muted mt-2">
                アカウントにログインしてください
              </Text>
            </View>

            {/* Form */}
            <View className="mt-8">
              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  メールアドレス
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  accessible
                  accessibilityLabel="メールアドレス入力欄"
                  accessibilityHint="メールアドレスを入力してください"
                />
              </View>

              {/* Password Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  パスワード
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="パスワードを入力"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  accessible
                  accessibilityLabel="パスワード入力欄"
                  accessibilityHint="パスワードを入力してください"
                />
              </View>

              {/* Error Message */}
              {error ? (
                <Text
                  className="text-error text-sm mb-4"
                  accessible
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Text>
              ) : null}

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  isLoading && { opacity: 0.6 },
                ]}
                accessible
                accessibilityLabel={isLoading ? "ログイン中" : "ログイン"}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoading }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Text>
              </Pressable>
            </View>

            {/* Register Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-muted">アカウントをお持ちでない方は </Text>
              <Pressable
                onPress={() => router.push("/(auth)/register" as any)}
                accessible
                accessibilityLabel="新規登録"
                accessibilityRole="link"
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  新規登録
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
