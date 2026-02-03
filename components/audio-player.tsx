import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility, formatDurationForA11y } from "@/lib/accessibility";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  uri: string;
  duration: number;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({ 
  uri, 
  duration, 
  onPlayStateChange,
  className,
  compact = false,
}: AudioPlayerProps) {
  const colors = useColors();
  const { triggerHaptic, settings } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const player = useAudioPlayer(uri || undefined);

  // Set audio mode for iOS
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Track playback state
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player.playing) {
        setCurrentTime(player.currentTime);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      player.release();
    };
  }, [player]);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!player) return;

    triggerHaptic("light");

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      // Apply playback speed
      player.playbackRate = settings.playbackSpeed;
      player.play();
      setIsPlaying(true);
      setIsLoaded(true);
      onPlayStateChange?.(true);
    }
  }, [player, isPlaying, triggerHaptic, onPlayStateChange, settings.playbackSpeed]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [
          styles.compactButton,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
        accessible
        accessibilityLabel={isPlaying ? "一時停止" : "再生"}
        accessibilityHint={`${formatDurationForA11y(duration)}の音声`}
        accessibilityRole="button"
      >
        <IconSymbol
          name={isPlaying ? "pause.fill" : "play.fill"}
          size={20}
          color="#FFFFFF"
        />
      </Pressable>
    );
  }

  return (
    <View className={cn("bg-surface rounded-2xl p-4", className)}>
      {/* Play button and time */}
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={togglePlay}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
          accessible
          accessibilityLabel={isPlaying ? "一時停止" : "再生"}
          accessibilityHint={`${formatDurationForA11y(duration)}の音声を${isPlaying ? "一時停止" : "再生"}します`}
          accessibilityRole="button"
        >
          <IconSymbol
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={28}
            color="#FFFFFF"
          />
        </Pressable>

        <View className="flex-1">
          {/* Progress bar */}
          <View 
            className="h-2 bg-border rounded-full overflow-hidden"
            accessible
            accessibilityLabel={`再生位置 ${Math.round(progress)}パーセント`}
            accessibilityRole="none"
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>

          {/* Time display */}
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-muted">
              {formatTime(currentTime)}
            </Text>
            <Text className="text-xs text-muted">
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>

      {/* Playback speed indicator */}
      {settings.playbackSpeed !== 1 && (
        <Text className="text-xs text-muted text-center mt-2">
          {settings.playbackSpeed}x 再生中
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
