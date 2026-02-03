import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

// Accessibility settings
export interface AccessibilitySettings {
  voiceOverEnabled: boolean;
  autoPlayFeed: boolean;
  hapticFeedback: boolean;
  playbackSpeed: number; // 0.5, 1, 1.5, 2
  announceScreenChanges: boolean;
  largeText: boolean;
  highContrast: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  voiceOverEnabled: false,
  autoPlayFeed: false,
  hapticFeedback: true,
  playbackSpeed: 1,
  announceScreenChanges: true,
  largeText: false,
  highContrast: false,
};

interface AccessibilityContextState {
  settings: AccessibilitySettings;
  isScreenReaderEnabled: boolean;
  updateSettings: (updates: Partial<AccessibilitySettings>) => Promise<void>;
  announce: (message: string) => void;
  triggerHaptic: (type: "light" | "medium" | "heavy" | "success" | "error") => void;
}

const AccessibilityContext = createContext<AccessibilityContextState | undefined>(undefined);

const SETTINGS_KEY = "@audire_accessibility";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Check screen reader status
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
      setSettings(prev => ({ ...prev, voiceOverEnabled: enabled }));
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
        setSettings(prev => ({ ...prev, voiceOverEnabled: enabled }));
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings)).catch(console.error);
      return newSettings;
    });
  }, []);

  // Announce message for screen readers
  const announce = useCallback((message: string) => {
    if (Platform.OS !== "web") {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "success" | "error") => {
    if (!settings.hapticFeedback || Platform.OS === "web") return;

    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }, [settings.hapticFeedback]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        isScreenReaderEnabled,
        updateSettings,
        announce,
        triggerHaptic,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}

// Accessibility helper hook for components
export function useA11yProps(options: {
  label: string;
  hint?: string;
  role?: "button" | "link" | "header" | "text" | "image" | "none";
  state?: {
    selected?: boolean;
    disabled?: boolean;
    checked?: boolean;
    busy?: boolean;
  };
}) {
  return {
    accessible: true,
    accessibilityLabel: options.label,
    accessibilityHint: options.hint,
    accessibilityRole: options.role,
    accessibilityState: options.state,
  };
}

// Format duration for screen readers
export function formatDurationForA11y(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}秒`;
  }
  return `${mins}分${secs}秒`;
}

// Format relative time for screen readers
export function formatRelativeTimeForA11y(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
