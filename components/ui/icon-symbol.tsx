// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  // Audio & Recording
  "mic.fill": "mic",
  "mic": "mic-none",
  "waveform": "graphic-eq",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  // Social
  "person.fill": "person",
  "person.2.fill": "people",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "bubble.left.fill": "chat-bubble",
  "bell.fill": "notifications",
  // Discovery & Search
  "magnifyingglass": "search",
  "compass.fill": "explore",
  // Stories & Live
  "clock.fill": "schedule",
  "antenna.radiowaves.left.and.right": "wifi-tethering",
  "radio.fill": "radio",
  // Settings
  "gearshape.fill": "settings",
  "hand.raised.fill": "pan-tool",
  // Actions
  "plus": "add",
  "xmark": "close",
  "checkmark": "check",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "square.and.arrow.up": "share",
  // Accessibility
  "accessibility": "accessibility",
  "ear.fill": "hearing",
} as const satisfies Record<string, MaterialIconName>;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
