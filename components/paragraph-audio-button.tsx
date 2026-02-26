import { useState, useEffect } from "react";
import { TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

// Cache expiration time: 7 days
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedAudio {
  url: string;
  timestamp: number;
}

interface ParagraphAudioButtonProps {
  text: string;
  paragraphIndex: number;
  onPlaybackStatusChange?: (isPlaying: boolean, currentTime: number, duration: number) => void;
}

/**
 * Button to play TTS audio for a specific paragraph
 */
export function ParagraphAudioButton({ text, paragraphIndex, onPlaybackStatusChange }: ParagraphAudioButtonProps) {
  const colors = useColors();
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const player = useAudioPlayer(audioUrl || undefined);
  const status = useAudioPlayerStatus(player);
  const generateTTS = trpc.tts.generate.useMutation();

  const isPlaying = status?.playing || false;
  const currentTime = status?.currentTime || 0;
  const duration = status?.duration || 0;

  // Notify parent component of playback status changes
  useEffect(() => {
    if (onPlaybackStatusChange) {
      onPlaybackStatusChange(isPlaying, currentTime, duration);
    }
  }, [isPlaying, currentTime, duration, onPlaybackStatusChange]);

  // Load cached audio URL on mount
  useEffect(() => {
    const loadCachedAudio = async () => {
      try {
        const cacheKey = `tts_cache_${text.substring(0, 50)}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData) {
          const cached: CachedAudio = JSON.parse(cachedData);
          const now = Date.now();
          
          // Check if cache is still valid
          if (now - cached.timestamp < CACHE_EXPIRATION_MS) {
            setAudioUrl(cached.url);
          } else {
            // Remove expired cache
            await AsyncStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error("Error loading cached audio:", error);
      }
    };
    
    loadCachedAudio();
  }, [text]);

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // If already playing, pause
    if (isPlaying && player) {
      player.pause();
      return;
    }

    // If audio URL exists, play
    if (audioUrl && player) {
      player.play();
      return;
    }

    // Generate TTS audio
    try {
      setIsGenerating(true);
      const result = await generateTTS.mutateAsync({
        text,
        voice: "alloy",
      });

      setAudioUrl(result.audioUrl);
      
      // Cache the audio URL
      try {
        const cacheKey = `tts_cache_${text.substring(0, 50)}`;
        const cachedData: CachedAudio = {
          url: result.audioUrl,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
      } catch (cacheError) {
        console.error("Error caching audio:", cacheError);
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (player) {
        player.release();
      }
    };
  }, [player]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isGenerating}
      className="w-8 h-8 items-center justify-center rounded-full bg-primary/10"
      activeOpacity={0.7}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : isPlaying ? (
        <Ionicons name="pause" size={16} color={colors.primary} />
      ) : (
        <Ionicons name="play" size={16} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}
