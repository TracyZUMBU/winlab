export type VideoCodecHint = "hevc" | "h264" | "unknown";

export function inferCodecHintFromUrl(url: string): VideoCodecHint {
  const lower = url.trim().toLowerCase();
  if (lower.includes("h265") || lower.includes("hevc")) return "hevc";
  if (lower.includes("h264") || lower.includes("avc")) return "h264";
  return "unknown";
}

export function isHevcVideoUrl(url: string): boolean {
  return inferCodecHintFromUrl(url) === "hevc";
}

export const HEVC_VIDEO_URL_ERROR_MESSAGE =
  "Format H.265 (HEVC) non compatible avec l’app iOS. Utilisez une vidéo encodée en H.264 (AVC).";

export function getHevcVideoUrlError(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  return isHevcVideoUrl(trimmed) ? HEVC_VIDEO_URL_ERROR_MESSAGE : null;
}
