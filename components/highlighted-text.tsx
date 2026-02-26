import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  currentTime: number;
  duration: number;
  className?: string;
}

/**
 * Displays text with the currently spoken word highlighted.
 * Estimates word timing based on audio duration and word count.
 */
export function HighlightedText({
  text,
  currentTime,
  duration,
  className,
}: HighlightedTextProps) {
  const words = useMemo(() => {
    // Split text into words, preserving punctuation
    return text.split(/(\s+)/).filter((w) => w.trim().length > 0);
  }, [text]);

  const currentWordIndex = useMemo(() => {
    if (duration === 0 || words.length === 0) return -1;
    
    // Simple estimation: divide duration by word count
    const timePerWord = duration / words.length;
    const index = Math.floor(currentTime / timePerWord);
    
    return Math.min(index, words.length - 1);
  }, [currentTime, duration, words.length]);

  return (
    <View className={cn("flex-row flex-wrap", className)}>
      {words.map((word, index) => {
        const isHighlighted = index === currentWordIndex;
        return (
          <Text
            key={`${word}-${index}`}
            className={cn(
              "text-base leading-relaxed",
              isHighlighted
                ? "bg-primary text-background font-semibold px-1 rounded"
                : "text-foreground"
            )}
          >
            {word}{" "}
          </Text>
        );
      })}
    </View>
  );
}
