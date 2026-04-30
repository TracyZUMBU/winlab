import type { Json } from "@/src/types/json";

import type { MissionType } from "../types";

export type DurationEstimate =
  | { kind: "minutes"; minutes: number }
  | { kind: "seconds"; seconds: number };

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Extracts `min_duration_seconds` from mission.metadata and converts it to a
 * UI-friendly estimate. Returns null when absent/invalid.
 */
export function getMissionDurationEstimateFromMetadata(
  metadata: Json | null | undefined,
): DurationEstimate | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, Json | undefined>;
  const seconds = toNumberOrNull(record.min_duration_seconds);
  if (!seconds || seconds <= 0) return null;

  const roundedSeconds = Math.max(1, Math.round(seconds));
  if (roundedSeconds >= 60) {
    const minutes = Math.max(1, Math.round(roundedSeconds / 60));
    return { kind: "minutes", minutes };
  }

  return { kind: "seconds", seconds: roundedSeconds };
}

export function getMissionDurationHintI18nKey(
  missionType: MissionType,
): string | null {
  switch (missionType) {
    case "survey":
      return "missions.durationHint.survey";
    case "video":
      return "missions.durationHint.video";
    case "follow":
      return "missions.durationHint.follow";
    default:
      return null;
  }
}

export function getMissionTypeLabelI18nKey(missionType: MissionType): string {
  switch (missionType) {
    case "survey":
      return "missions.detail.typeLabel.survey";
    case "video":
      return "missions.detail.typeLabel.video";
    case "follow":
      return "missions.detail.typeLabel.follow";
    case "referral":
      return "missions.detail.typeLabel.referral";
    case "custom":
      return "missions.detail.typeLabel.custom";
    case "daily_login":
      return "missions.detail.typeLabel.daily_login";
  }
}

