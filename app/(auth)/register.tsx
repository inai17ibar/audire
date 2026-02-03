import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { useAccessibility } from "@/lib/accessibility";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register } = useAppAuth();
  const { triggerHaptic, announce } = useAccessibility();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Announce screen on mount
  useEffect(() => {
    announce("新規登録画面です。名前、メールアドレス、パスワードを入力してください。");
  }, [announce]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("すべての項目を入力してください");
      triggerHaptic("error");
      announce("エラー。すべての項目を入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      triggerHaptic("error");
      announce("エラー。パスワードが一致しません。");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      triggerHaptic("error");
      announce("エラー。パスワードは6文字以上で入力してください。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await register(name, email, password);
      if (success) {
        triggerHaptic("success");
        announce("登録に成功しました。ようこそ、" + name + "さん。");
        router.replace("/(tabs)");
      } else {
        setError("登録に失敗しました");
        triggerHaptic("error");
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
            <View className="mt-4">
              <Text
                className="text-3xl font-bold text-foreground"
                accessible
                accessibilityRole="header"
              >
                アカウント作成
              </Text>
              <Text className="text-base text-muted mt-2">
                Audireへようこそ！情報を入力してください
              </Text>
            </View>

            {/* Form */}
            <View className="mt-6">
              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  名前
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="あなたの名前"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
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
                  accessibilityLabel="名前入力欄"
                  accessibilityHint="あなたの名前を入力してください"
                />
              </View>

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
                  placeholder="6文字以上"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoComplete="new-password"
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
                  accessibilityLabel="パスワード入力欄"
                  accessibilityHint="6文字以上のパスワードを入力してください"
                />
              </View>

              {/* Confirm Password Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  パスワード（確認）
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="パスワードを再入力"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  accessible
                  accessibilityLabel="パスワード確認入力欄"
                  accessibilityHint="パスワードをもう一度入力してください"
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

              {/* Register Button */}
              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.registerButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  isLoading && { opacity: 0.6 },
                ]}
                accessible
                accessibilityLabel={isLoading ? "登録中" : "登録する"}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoading }}
              >
                <Text style={styles.registerButtonText}>
                  {isLoading ? "登録中..." : "登録する"}
                </Text>
              </Pressable>
            </View>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6 pb-8">
              <Text className="text-muted">すでにアカウントをお持ちの方は </Text>
              <Pressable
                onPress={() => router.push("/(auth)/login" as any)}
                accessible
                accessibilityLabel="ログイン"
                accessibilityRole="link"
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  ログイン
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
  registerButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
