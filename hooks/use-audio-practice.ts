import { useState, useEffect, useCallback } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  setAudioModeAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { PlaybackSpeed } from "@/types";
import { trpc } from "@/lib/trpc";
import { storagePut } from "@/server/storage";
import { Platform } from "react-native";
import { getAudioUrlForPlayback } from "@/lib/offline-audio";

export function useAudioPractice(articleText: string, cachedAudioUrl?: string, audioCachedAt?: string) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const player = useAudioPlayer(audioUrl || "");
  const playerStatus = useAudioPlayerStatus(player);
  const recordingPlayer = useAudioPlayer(recordingUri || "");
  const recordingPlayerStatus = useAudioPlayerStatus(recordingPlayer);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const generateAudioMutation = trpc.tts.generate.useMutation();

  // Initialize audio mode
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          console.warn("Recording permission not granted");
        }
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    })();
  }, []);

  // Check if cached audio is still valid (7 days)
  const isCacheValid = useCallback(() => {
    if (!cachedAudioUrl || !audioCachedAt) return false;
    
    const cacheDate = new Date(audioCachedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff < 7; // Cache valid for 7 days
  }, [cachedAudioUrl, audioCachedAt]);

  // Load audio (cached or local) if available
  useEffect(() => {
    (async () => {
      if (!audioUrl) {
        // Try to get audio URL for playback (handles offline/online)
        if (cachedAudioUrl || audioCachedAt) {
          const article = {
            audioUrl: cachedAudioUrl,
            audioCachedAt,
            localAudioPath: undefined, // Will be passed separately if needed
          };
          
          if (isCacheValid() && cachedAudioUrl) {
            console.log("Using cached audio:", cachedAudioUrl);
            setAudioUrl(cachedAudioUrl);
          }
        }
      }
    })();
  }, [cachedAudioUrl, audioCachedAt, audioUrl, isCacheValid]);

  // Generate audio from text
  const generateAudio = useCallback(async () => {
    if (isGeneratingAudio || audioUrl) return;

    setIsGeneratingAudio(true);
    try {
      const result = await generateAudioMutation.mutateAsync({
        text: articleText,
        voice: "alloy",
      });
      setAudioUrl(result.audioUrl);
      
      // Return audio URL and cache timestamp for saving
      return {
        audioUrl: result.audioUrl,
        audioCachedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating audio:", error);
      return null;
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [articleText, audioUrl, isGeneratingAudio]);

  // Playback controls
  const play = useCallback(() => {
    if (!audioUrl) {
      generateAudio();
      return;
    }
    player.play();
  }, [audioUrl, player, generateAudio]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const newPosition = Math.max(0, Math.min(playerStatus.currentTime + seconds, playerStatus.duration));
      player.seekTo(newPosition);
    },
    [player, playerStatus]
  );

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, playerStatus.duration || 0));
      player.seekTo(clampedTime);
    },
    [player, playerStatus]
  );

  const changeSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      setPlaybackSpeed(speed);
      player.setPlaybackRate(speed);
    },
    [player]
  );

  // Recording controls
  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordingUri(uri);
      return uri;
    } catch (error) {
      console.error("Error stopping recording:", error);
      return null;
    }
  }, [audioRecorder]);

  // Recording playback controls
  const playRecording = useCallback(() => {
    if (recordingUri) {
      // Pause main audio if playing
      if (playerStatus.playing) {
        player.pause();
      }
      recordingPlayer.play();
      setIsPlayingRecording(true);
    }
  }, [recordingUri, recordingPlayer, player, playerStatus]);

  const pauseRecording = useCallback(() => {
    recordingPlayer.pause();
    setIsPlayingRecording(false);
  }, [recordingPlayer]);

  // Update isPlayingRecording based on recording player status
  useEffect(() => {
    if (!recordingPlayerStatus.playing && isPlayingRecording) {
      setIsPlayingRecording(false);
    }
  }, [recordingPlayerStatus.playing, isPlayingRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (Platform.OS !== "web" && player) {
        try {
          player.release();
        } catch (error) {
          console.error("Error releasing player:", error);
        }
      }
    };
  }, [player]);

  return {
    // Audio generation
    audioUrl,
    isGeneratingAudio,
    generateAudio,

    // Playback state
    isPlaying: playerStatus.playing,
    currentTime: playerStatus.currentTime,
    duration: playerStatus.duration,
    playbackSpeed,

    // Playback controls
    play,
    pause,
    seekBy,
    seekTo,
    changeSpeed,

    // Recording state
    isRecording: recorderState.isRecording,
    recordingUri,
    isPlayingRecording,
    recordingDuration: recordingPlayerStatus.duration,
    recordingCurrentTime: recordingPlayerStatus.currentTime,

    // Recording controls
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
  };
}
