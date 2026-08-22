import { useWindowDimensions } from "react-native";

export type RecordingLayoutKind =
  | "phone-portrait"
  | "phone-landscape"
  | "tablet-portrait"
  | "tablet-landscape";

// Common breakpoint for "tablet-sized" screens, independent of orientation.
const TABLET_MIN_DIMENSION = 600;

export function classifyLayout(width: number, height: number): RecordingLayoutKind {
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= TABLET_MIN_DIMENSION;

  if (isTablet) return isLandscape ? "tablet-landscape" : "tablet-portrait";
  return isLandscape ? "phone-landscape" : "phone-portrait";
}

export function useResponsiveLayout(): RecordingLayoutKind {
  const { width, height } = useWindowDimensions();
  return classifyLayout(width, height);
}
