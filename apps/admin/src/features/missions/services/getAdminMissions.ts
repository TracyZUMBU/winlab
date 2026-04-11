import { getSupabaseClient } from "../../../lib/supabase";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import {
  MISSION_ADMIN_STATUSES,
  MISSION_ADMIN_TYPES,
  MISSION_ADMIN_VALIDATION_MODES,
  type AdminMissionListItem,
  type AdminMissionsListFilters,
  type GetAdminMissionsParams,
  type MissionAdminStatus,
  type MissionAdminType,
  type MissionAdminValidationMode,
} from "../types/missionAdmin";

const RPC_ADMIN_GET_MISSIONS = "admin_get_missions";

const STATUS_SET = new Set<string>(MISSION_ADMIN_STATUSES);
const TYPE_SET = new Set<string>(MISSION_ADMIN_TYPES);
const VALIDATION_SET = new Set<string>(MISSION_ADMIN_VALIDATION_MODES);

type AdminMissionsRpcRow = {
  mission_id: string;
  title: string;
  brand_id: string;
  brand_name: string | null;
  mission_type: string;
  status: string;
  token_reward: number;
  validation_mode: string;
  starts_at: string | null;
  ends_at: string | null;
  total_completions: number | string | null;
};

function parseMissionStatus(raw: unknown): MissionAdminStatus {
  if (typeof raw === "string" && STATUS_SET.has(raw)) {
    return raw as MissionAdminStatus;
  }
  return "unknown";
}

function parseMissionType(raw: unknown): MissionAdminType {
  if (typeof raw === "string" && TYPE_SET.has(raw)) {
    return raw as MissionAdminType;
  }
  return "unknown";
}

function parseValidationMode(raw: unknown): MissionAdminValidationMode {
  if (typeof raw === "string" && VALIDATION_SET.has(raw)) {
    return raw as MissionAdminValidationMode;
  }
  return "unknown";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function toNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return fallback;
}

function buildFilterRpcArgs(filters: AdminMissionsListFilters): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  const q =
    filters.titleSearch != null ? String(filters.titleSearch).trim() : "";
  if (q !== "") {
    args.p_title_search = q;
  }
  const brandId = filters.brandId != null ? String(filters.brandId).trim() : "";
  if (brandId !== "") {
    args.p_brand_id = brandId;
  }
  if (filters.status != null) {
    args.p_status = filters.status;
  }
  if (filters.missionType != null) {
    args.p_mission_type = filters.missionType;
  }
  return args;
}

function mapRpcRowToListItem(row: AdminMissionsRpcRow): AdminMissionListItem | null {
  if (!isNonEmptyString(row.mission_id)) {
    return null;
  }
  if (!isNonEmptyString(row.title)) {
    return null;
  }
  if (!isNonEmptyString(row.brand_id)) {
    return null;
  }
  if (typeof row.token_reward !== "number" || Number.isNaN(row.token_reward)) {
    return null;
  }

  const brand_name =
    row.brand_name === null || row.brand_name === undefined
      ? null
      : typeof row.brand_name === "string"
        ? row.brand_name
        : null;

  const starts_at =
    row.starts_at === null || row.starts_at === undefined
      ? null
      : typeof row.starts_at === "string"
        ? row.starts_at
        : null;
  const ends_at =
    row.ends_at === null || row.ends_at === undefined
      ? null
      : typeof row.ends_at === "string"
        ? row.ends_at
        : null;

  return {
    mission_id: row.mission_id,
    title: row.title,
    brand_id: row.brand_id,
    brand_name,
    mission_type: parseMissionType(row.mission_type),
    status: parseMissionStatus(row.status),
    token_reward: row.token_reward,
    validation_mode: parseValidationMode(row.validation_mode),
    starts_at,
    ends_at,
    total_completions: toNonNegativeInt(row.total_completions, 0),
  };
}

/**
 * Liste paginée des missions via `admin_get_missions` (SECURITY DEFINER + garde admin en base).
 * Les lignes invalides sont ignorées.
 *
 * @example
 * ```ts
 * const r = await getAdminMissions({
 *   limit: 20,
 *   offset: 0,
 *   sort: "created_at_desc",
 *   brandId: brandUuid,
 * });
 * if (r.success) console.log(r.data);
 * ```
 */
export async function getAdminMissions(
  params: GetAdminMissionsParams = {},
): Promise<ServiceResult<AdminMissionListItem[]>> {
  try {
    const supabase = getSupabaseClient();
    const rpcArgs: Record<string, unknown> = {
      ...buildFilterRpcArgs(params),
    };
    if (params.limit !== undefined) {
      rpcArgs.p_limit = params.limit;
    }
    if (params.offset !== undefined) {
      rpcArgs.p_offset = params.offset;
    }
    if (params.sort !== undefined) {
      rpcArgs.p_sort = params.sort;
    }

    const { data, error } = await supabase.rpc(RPC_ADMIN_GET_MISSIONS, rpcArgs);

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const rows = (data ?? []) as AdminMissionsRpcRow[];
    const missions: AdminMissionListItem[] = [];

    for (const raw of rows) {
      const item = mapRpcRowToListItem(raw);
      if (item) {
        missions.push(item);
      }
    }

    return { success: true, data: missions };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
