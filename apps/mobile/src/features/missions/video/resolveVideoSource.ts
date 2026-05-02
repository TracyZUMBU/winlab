import type { VideoSource as ExpoVideoSource } from "expo-video";

/**
 * Source prête pour `useVideoPlayer` / `VideoView` (expo-video).
 * Ré-export typé pour que les écrans dépendent de ce module plutôt que d'expo directement.
 */
export type VideoSource = ExpoVideoSource;

/**
 * Transforme une URL mission en source exploitable par expo-video.
 *
 * // TODO: supporter YouTube (extraire videoId, utiliser WebView)
 * // TODO: supporter CDN externe (même logique que mp4)
 */
export function resolveVideoSource(url: string): VideoSource {
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}
