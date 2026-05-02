import type { Json } from "@/src/types/json";

export type ExternalActionMissionMetadata = {
  external_url: string;
  platform: string;
  action_label: string;
  min_external_duration_seconds?: number;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Parses `missions.metadata` for `mission_type === 'external_action'`.
 * Returns `null` when required fields are missing or invalid.
 */
export function parseExternalActionMissionMetadata(
  metadata: Json | null | undefined,
): ExternalActionMissionMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  if (
    !isNonEmptyString(record.external_url) ||
    !isNonEmptyString(record.platform) ||
    !isNonEmptyString(record.action_label)
  ) {
    return null;
  }

  const min = record.min_external_duration_seconds;
  let min_external_duration_seconds: number | undefined;
  if (typeof min === "number" && Number.isFinite(min) && min >= 0) {
    min_external_duration_seconds = Math.trunc(min);
  } else if (typeof min === "string" && min.trim() !== "") {
    const parsed = Number.parseInt(min, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      min_external_duration_seconds = parsed;
    }
  }

  return {
    external_url: record.external_url.trim(),
    platform: record.platform.trim().toLowerCase(),
    action_label: record.action_label.trim(),
    ...(min_external_duration_seconds !== undefined
      ? { min_external_duration_seconds }
      : {}),
  };
}
