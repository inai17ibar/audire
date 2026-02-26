import React, { useState, useCallback } from "react";
import { View, Text, Pressable, GestureResponderEvent } from "react-native";
import { cn } from "@/lib/utils";

interface AudioSeekbarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioSeekbar({ currentTime, duration, onSeek, className }: AudioSeekbarProps) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isSeeking ? seekPosition : progress;

  const handleSeekStart = useCallback((event: GestureResponderEvent) => {
    setIsSeeking(true);
    const { nativeEvent } = event;
    const locationX = nativeEvent.locationX || 0;
    const width = (nativeEvent.target as any)?.offsetWidth || 300;
    const percent = Math.max(0, Math.min(100, (locationX / width) * 100));
    setSeekPosition(percent);
  }, []);

  const handleSeekMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!isSeeking) return;
      const { nativeEvent } = event;
      const locationX = nativeEvent.locationX || 0;
      const width = (nativeEvent.target as any)?.offsetWidth || 300;
      const percent = Math.max(0, Math.min(100, (locationX / width) * 100));
      setSeekPosition(percent);
    },
    [isSeeking]
  );

  const handleSeekEnd = useCallback(() => {
    if (isSeeking && duration > 0) {
      const newTime = (seekPosition / 100) * duration;
      onSeek(newTime);
    }
    setIsSeeking(false);
  }, [isSeeking, seekPosition, duration, onSeek]);

  return (
    <View className={cn("gap-2", className)}>
      {/* Time display */}
      <View className="flex-row justify-between">
        <Text className="text-sm text-muted">
          {formatTime(isSeeking ? (seekPosition / 100) * duration : currentTime)}
        </Text>
        <Text className="text-sm text-muted">{formatTime(duration)}</Text>
      </View>

      {/* Seekbar */}
      <Pressable
        onPressIn={handleSeekStart}
        onPressOut={handleSeekEnd}
        onTouchMove={handleSeekMove}
        className="h-10 justify-center"
      >
        <View className="h-1 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{ width: `${displayProgress}%` }}
          />
        </View>

        {/* Seek thumb */}
        <View
          className="absolute h-4 w-4 bg-primary rounded-full"
          style={{
            left: `${displayProgress}%`,
            marginLeft: -8,
            top: "50%",
            marginTop: -8,
          }}
        />
      </Pressable>
    </View>
  );
}
