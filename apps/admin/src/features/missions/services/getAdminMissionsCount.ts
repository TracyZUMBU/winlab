import { getSupabaseClient } from "../../../lib/supabase";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { AdminMissionsListFilters } from "../types/missionAdmin";

const RPC_ADMIN_GET_MISSIONS_COUNT = "admin_get_missions_count";

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

function normalizeCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.trunc(raw);
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return 0;
}

/**
 * Total de missions pour la pagination, via `admin_get_missions_count`.
 * Les filtres doivent être identiques à ceux passés à `getAdminMissions`.
 *
 * @example
 * ```ts
 * const filters = { brandId: id, status: "active" as const };
 * const c = await getAdminMissionsCount(filters);
 * const list = await getAdminMissions({ ...filters, limit: 20, offset: 0 });
 * ```
 */
export async function getAdminMissionsCount(
  filters: AdminMissionsListFilters = {},
): Promise<ServiceResult<number>> {
  try {
    const supabase = getSupabaseClient();
    const rpcArgs = buildFilterRpcArgs(filters);

    const { data, error } = await supabase.rpc(
      RPC_ADMIN_GET_MISSIONS_COUNT,
      rpcArgs,
    );

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    return { success: true, data: normalizeCount(data) };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
