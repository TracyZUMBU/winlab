import type { Json } from "@/src/types/json";

export type VideoMissionPlayerMetadata = {
  video_url: string;
  title: string;
  thumbnail_url?: string;
};

export function parseVideoMissionMetadata(
  metadata: Json | null,
): VideoMissionPlayerMetadata | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const video_url =
    typeof record.video_url === "string" ? record.video_url.trim() : "";
  if (!video_url) {
    return null;
  }

  const rawTitle = typeof record.title === "string" ? record.title.trim() : "";
  const title = rawTitle.length > 0 ? rawTitle : video_url;

  const thumbnail_url =
    typeof record.thumbnail_url === "string" && record.thumbnail_url.trim().length > 0
      ? record.thumbnail_url.trim()
      : undefined;

  return {
    video_url,
    title,
    thumbnail_url,
  };
}
