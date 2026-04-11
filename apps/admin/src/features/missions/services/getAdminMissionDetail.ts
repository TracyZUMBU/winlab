import { getSupabaseClient } from "../../../lib/supabase";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import {
  MISSION_ADMIN_STATUSES,
  MISSION_ADMIN_TYPES,
  MISSION_ADMIN_VALIDATION_MODES,
  type AdminMissionCompletedUser,
  type AdminMissionDetail,
  type MissionAdminStatus,
  type MissionAdminType,
  type MissionAdminValidationMode,
} from "../types/missionAdmin";

const RPC_ADMIN_GET_MISSION_DETAIL = "admin_get_mission_detail";

const STATUS_SET = new Set<string>(MISSION_ADMIN_STATUSES);
const TYPE_SET = new Set<string>(MISSION_ADMIN_TYPES);
const VALIDATION_SET = new Set<string>(MISSION_ADMIN_VALIDATION_MODES);

type AdminMissionDetailRpcRow = {
  mission_id: string;
  title: string;
  description: string | null;
  brand_id: string;
  brand_name: string | null;
  mission_type: string;
  status: string;
  token_reward: number;
  validation_mode: string;
  starts_at: string | null;
  ends_at: string | null;
  max_completions_total: number | null;
  max_completions_per_user: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  total_completions: number | string | null;
  pending_completions: number | string | null;
  approved_completions: number | string | null;
  rejected_completions: number | string | null;
  completed_users: unknown;
};

function parseStatus(raw: string): MissionAdminStatus {
  return STATUS_SET.has(raw) ? (raw as MissionAdminStatus) : "unknown";
}

function parseMissionType(raw: string): MissionAdminType {
  return TYPE_SET.has(raw) ? (raw as MissionAdminType) : "unknown";
}

function parseValidationMode(raw: string): MissionAdminValidationMode {
  return VALIDATION_SET.has(raw)
    ? (raw as MissionAdminValidationMode)
    : "unknown";
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return 0;
}

function toOptionalPositiveInt(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number.parseInt(value, 10);
    if (n > 0) {
      return n;
    }
  }
  return null;
}

function toRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseCompletedUsersJson(raw: unknown): AdminMissionCompletedUser[] {
  if (raw == null) {
    return [];
  }
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) {
    return [];
  }

  const out: AdminMissionCompletedUser[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const userId = toRequiredString(o.user_id);
    const username = toRequiredString(o.username);
    if (userId == null || username == null) {
      continue;
    }
    out.push({ user_id: userId, username });
  }
  return out;
}

function mapDetailRow(row: AdminMissionDetailRpcRow): AdminMissionDetail | null {
  if (!row.mission_id || !row.title || !row.brand_id) {
    return null;
  }
  const created_at = toRequiredString(row.created_at);
  const updated_at = toRequiredString(row.updated_at);
  if (created_at == null || updated_at == null) {
    return null;
  }

  const maxPerUser =
    typeof row.max_completions_per_user === "number" &&
    !Number.isNaN(row.max_completions_per_user)
      ? Math.trunc(row.max_completions_per_user)
      : 0;

  return {
    mission_id: row.mission_id,
    title: row.title,
    description: row.description ?? null,
    brand_id: row.brand_id,
    brand_name: row.brand_name ?? null,
    mission_type: parseMissionType(row.mission_type),
    status: parseStatus(row.status),
    token_reward:
      typeof row.token_reward === "number" && !Number.isNaN(row.token_reward)
        ? row.token_reward
        : 0,
    validation_mode: parseValidationMode(row.validation_mode),
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
    max_completions_total: toOptionalPositiveInt(row.max_completions_total),
    max_completions_per_user: maxPerUser,
    image_url: row.image_url ?? null,
    created_at,
    updated_at,
    total_completions: toNonNegativeInt(row.total_completions),
    pending_completions: toNonNegativeInt(row.pending_completions),
    approved_completions: toNonNegativeInt(row.approved_completions),
    rejected_completions: toNonNegativeInt(row.rejected_completions),
    completed_users: parseCompletedUsersJson(row.completed_users),
  };
}

/**
 * Détail d’une mission via `admin_get_mission_detail`.
 * `data: null` si aucune ligne (id inconnu). Accès refusé → `success: false`, `errorCode` adapté.
 *
 * @example
 * ```ts
 * const r = await getAdminMissionDetail(missionId);
 * if (r.success && r.data) {
 *   console.log(r.data.total_completions, r.data.completed_users);
 * }
 * ```
 */
export async function getAdminMissionDetail(
  missionId: string,
): Promise<ServiceResult<AdminMissionDetail | null>> {
  const trimmed = missionId.trim();
  if (!trimmed) {
    return { success: true, data: null };
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc(RPC_ADMIN_GET_MISSION_DETAIL, {
      p_mission_id: trimmed,
    });

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const rows = (Array.isArray(data) ? data : []) as AdminMissionDetailRpcRow[];
    const first = rows[0];
    if (!first) {
      return { success: true, data: null };
    }

    const mapped = mapDetailRow(first);
    return { success: true, data: mapped };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
