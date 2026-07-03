import { Platform } from "react-native";

export type VideoCodecHint = "hevc" | "h264" | "unknown";

export function inferCodecHintFromUrl(url: string): VideoCodecHint {
  const lower = url.toLowerCase();
  if (lower.includes("h265") || lower.includes("hevc")) return "hevc";
  if (lower.includes("h264") || lower.includes("avc")) return "h264";
  return "unknown";
}

/**
 * H.265/HEVC remote MP4 is unreliable on iOS (expo-video / AVPlayer): metadata may load
 * (`readyToPlay`) while frames never render. Android (ExoPlayer) handles it fine.
 */
export function isHevcVideoUrl(url: string): boolean {
  return inferCodecHintFromUrl(url) === "hevc";
}

export function isVideoBlockedOnPlatform(url: string): boolean {
  return Platform.OS === "ios" && isHevcVideoUrl(url);
}
