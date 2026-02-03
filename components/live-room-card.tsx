import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility, formatRelativeTimeForA11y } from "@/lib/accessibility";
import { cn } from "@/lib/utils";
import type { LiveRoom } from "@/lib/audio-context";

interface LiveRoomCardProps {
  room: LiveRoom;
  onPress?: () => void;
  className?: string;
}

export function LiveRoomCard({ room, onPress, className }: LiveRoomCardProps) {
  const colors = useColors();
  const { triggerHaptic } = useAccessibility();

  const handlePress = () => {
    triggerHaptic("light");
    onPress?.();
  };

  // Generate initials for host avatar
  const initials = room.hostName.slice(0, 2);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
      className={cn("bg-surface rounded-2xl p-4 mb-4", className)}
      accessible
      accessibilityLabel={`${room.title}。ホスト${room.hostName}さん。${room.listeners}人が参加中。${room.speakers.length}人が発言中`}
      accessibilityHint="タップしてルームに参加します"
      accessibilityRole="button"
    >
      {/* Live indicator */}
      <View className="flex-row items-center mb-3">
        <View style={[styles.liveIndicator, { backgroundColor: colors.error }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text className="text-sm text-muted ml-2">
          {formatRelativeTimeForA11y(room.createdAt)}から配信中
        </Text>
      </View>

      {/* Room title */}
      <Text className="text-lg font-semibold text-foreground mb-3">
        {room.title}
      </Text>

      {/* Host info */}
      <View className="flex-row items-center mb-4">
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View className="ml-3">
          <Text className="text-base font-medium text-foreground">
            {room.hostName}
          </Text>
          <Text className="text-sm text-muted">ホスト</Text>
        </View>
      </View>

      {/* Speakers */}
      {room.speakers.length > 1 && (
        <View className="flex-row items-center mb-4">
          <IconSymbol name="mic.fill" size={16} color={colors.success} />
          <Text className="text-sm text-muted ml-2">
            {room.speakers.length}人が発言中
          </Text>
        </View>
      )}

      {/* Stats */}
      <View className="flex-row items-center pt-3 border-t border-border">
        <IconSymbol name="person.2.fill" size={20} color={colors.muted} />
        <Text className="text-base text-muted ml-2">
          {room.listeners}人が参加中
        </Text>

        {/* Join button */}
        <View
          style={[styles.joinButton, { backgroundColor: colors.primary }]}
          className="ml-auto"
        >
          <Text style={styles.joinButtonText}>参加する</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
