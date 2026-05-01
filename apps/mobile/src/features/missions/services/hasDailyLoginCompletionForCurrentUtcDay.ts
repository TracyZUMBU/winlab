import { logger } from "@/src/lib/logger";
import { getSupabaseClient } from "@/src/lib/supabase/client";

const HAS_DAILY_LOGIN_COMPLETION_FOR_CURRENT_UTC_DAY_RPC =
  "has_daily_login_completion_for_current_utc_day";

export type HasDailyLoginCompletionForCurrentUtcDayResult =
  | { ok: true; hasCompletion: boolean }
  | { ok: false };

/**
 * Server truth for daily_login (pending/approved completion on current UTC calendar day).
 * On RPC failure returns `{ ok: false }` so callers can fall back to submit_mission_completion.
 */
export async function hasDailyLoginCompletionForCurrentUtcDay(
  missionId: string,
): Promise<HasDailyLoginCompletionForCurrentUtcDayResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc(
    HAS_DAILY_LOGIN_COMPLETION_FOR_CURRENT_UTC_DAY_RPC,
    { p_mission_id: missionId },
  );

  if (error) {
    logger.warn(
      "[missions] has_daily_login_completion_for_current_utc_day RPC failed",
      { missionId, error },
    );
    return { ok: false };
  }

  const hasCompletion = data === true;

  return { ok: true, hasCompletion };
}
