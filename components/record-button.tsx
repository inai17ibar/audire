import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (duration: number) => void;
  isRecording?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RecordButton({
  onRecordingStart,
  onRecordingStop,
  isRecording: externalIsRecording,
  disabled = false,
  className,
}: RecordButtonProps) {
  const colors = useColors();
  const { triggerHaptic, announce } = useAccessibility();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animation values
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Use external recording state if provided
  const recording = externalIsRecording !== undefined ? externalIsRecording : isRecording;

  // Pulse animation when recording
  useEffect(() => {
    if (recording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(pulseOpacity);
      scale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0.3, { duration: 200 });
    }
  }, [recording, scale, pulseOpacity]);

  // Timer for recording duration
  useEffect(() => {
    if (recording) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording]);

  // Handle press
  const handlePressIn = useCallback(() => {
    if (disabled) return;
    
    triggerHaptic("medium");
    setIsRecording(true);
    setDuration(0);
    announce("録音を開始しました");
    onRecordingStart?.();
  }, [disabled, triggerHaptic, announce, onRecordingStart]);

  const handlePressOut = useCallback(() => {
    if (disabled || !recording) return;

    triggerHaptic("success");
    setIsRecording(false);
    announce(`録音を停止しました。${duration}秒間録音しました`);
    onRecordingStop?.(duration);
  }, [disabled, recording, duration, triggerHaptic, announce, onRecordingStop]);

  // Format duration display
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View className={cn("items-center", className)}>
      {/* Duration display */}
      <Text
        className="text-4xl font-bold text-foreground mb-6"
        accessible
        accessibilityLabel={recording ? `録音中 ${formatDuration(duration)}` : "録音待機中"}
        accessibilityRole="text"
      >
        {formatDuration(duration)}
      </Text>

      {/* Record button with pulse effect */}
      <View style={styles.buttonContainer}>
        {/* Pulse ring */}
        {recording && (
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: colors.error },
              animatedPulseStyle,
            ]}
          />
        )}

        {/* Main button */}
        <Animated.View style={animatedButtonStyle}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: recording ? colors.error : colors.primary,
                opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
              },
            ]}
            accessible
            accessibilityLabel={recording ? "録音を停止" : "長押しで録音開始"}
            accessibilityHint={recording ? "指を離すと録音を停止します" : "ボタンを長押しして音声を録音します"}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
          >
            <View
              style={[
                styles.innerCircle,
                recording && styles.innerCircleRecording,
              ]}
            />
          </Pressable>
        </Animated.View>
      </View>

      {/* Instructions */}
      <Text
        className="text-base text-muted mt-6 text-center"
        accessible
        accessibilityRole="text"
      >
        {recording ? "指を離すと録音停止" : "長押しで録音開始"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  innerCircleRecording: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
});
