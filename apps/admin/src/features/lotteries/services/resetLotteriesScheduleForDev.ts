import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient } from "../../../lib/supabase";

const RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE = "admin_dev_reset_lotteries_schedule";

function toUpdatedCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.trunc(raw));
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return 0;
}

/**
 * Action temporaire de développement : redistribue les dates des loteries non tirées.
 * TODO(dev-reset-lotteries): supprimer avant mise en production.
 */
export async function resetLotteriesScheduleForDev(): Promise<
  ServiceResult<{ updatedCount: number }>
> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc(RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE);

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    return {
      success: true,
      data: { updatedCount: toUpdatedCount(data) },
    };
  } catch (error) {
    return { success: false, errorCode: mapSupabaseToErrorCode(error) };
  }
}
