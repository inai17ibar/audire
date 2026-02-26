import { useState } from "react";
import { View, Text } from "react-native";
import { HighlightedText } from "./highlighted-text";
import { ParagraphAudioButton } from "./paragraph-audio-button";

interface InterleavedTextProps {
  englishText: string;
  japaneseText: string;
  currentTime: number;
  duration: number;
}

/**
 * Display English and Japanese text in interleaved paragraphs
 * English paragraph 1 → Japanese paragraph 1 → English paragraph 2 → Japanese paragraph 2 → ...
 */
export function InterleavedText({
  englishText,
  japaneseText,
  currentTime,
  duration,
}: InterleavedTextProps) {
  // Track which paragraph is currently playing TTS audio
  const [playingParagraph, setPlayingParagraph] = useState<{
    index: number;
    currentTime: number;
    duration: number;
  } | null>(null);

  // Split text by double newlines (paragraphs)
  const englishParagraphs = englishText.split("\n\n").filter((p) => p.trim().length > 0);
  const japaneseParagraphs = japaneseText.split("\n\n").filter((p) => p.trim().length > 0);

  // Calculate total words in English text for highlighting
  const totalWords = englishText.split(/\s+/).length;
  let wordOffset = 0;

  return (
    <View className="gap-4">
      {englishParagraphs.map((englishPara, index) => {
        const japanesePara = japaneseParagraphs[index] || "";
        
        // Calculate word count for this paragraph
        const paraWords = englishPara.split(/\s+/).length;
        const paraStartWord = wordOffset;
        const paraEndWord = wordOffset + paraWords;
        wordOffset += paraWords;

        // Calculate if this paragraph should be highlighted
        const currentWordIndex = Math.floor((currentTime / duration) * totalWords);
        const shouldHighlight = currentWordIndex >= paraStartWord && currentWordIndex < paraEndWord;

        // Determine which time/duration to use for highlighting
        const isPlayingThisParagraph = playingParagraph?.index === index;
        const highlightCurrentTime = isPlayingThisParagraph 
          ? playingParagraph.currentTime 
          : currentTime;
        const highlightDuration = isPlayingThisParagraph 
          ? playingParagraph.duration 
          : duration;

        return (
          <View key={index} className="gap-2">
            {/* English paragraph with highlighting and audio button */}
            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <HighlightedText
                  text={englishPara}
                  currentTime={highlightCurrentTime}
                  duration={highlightDuration}
                  className="text-foreground text-base leading-relaxed"
                />
              </View>
              <ParagraphAudioButton 
                text={englishPara} 
                paragraphIndex={index}
                onPlaybackStatusChange={(isPlaying, currentTime, duration) => {
                  if (isPlaying && duration > 0) {
                    setPlayingParagraph({ index, currentTime, duration });
                  } else if (!isPlaying && playingParagraph?.index === index) {
                    setPlayingParagraph(null);
                  }
                }}
              />
            </View>
            
            {/* Japanese translation paragraph */}
            {japanesePara && (
              <Text className="text-muted text-sm leading-relaxed pl-2 border-l-2 border-primary/30">
                {japanesePara}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
