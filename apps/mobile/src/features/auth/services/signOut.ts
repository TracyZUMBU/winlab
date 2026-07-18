import { clearDailyLoginLocalCache } from "@/src/features/missions/services/clearDailyLoginLocalCache";
import {
  clearPendingDailyLoginUiOverride,
  invalidateAppBootstrapCache,
} from "@/src/lib/bootstrap/sharedAppBootstrap";
import { isInvalidRefreshTokenError } from "@/src/lib/supabase/authErrors";
import { clearLocalSupabaseSession } from "@/src/lib/supabase/clearLocalSession";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { logger } from "@/src/lib/logger";

async function clearAppAuthCaches(): Promise<void> {
  clearPendingDailyLoginUiOverride();
  invalidateAppBootstrapCache();
  await clearDailyLoginLocalCache();
}

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    // Global revoke often fails when the refresh token is already invalid; still
    // wipe local persistence so the next launch does not retry a dead session.
    logger.warn("[auth] global signOut failed; clearing local session", {
      error,
      isInvalidRefreshToken: isInvalidRefreshTokenError(error),
    });
    await clearLocalSupabaseSession();
  }

  await clearAppAuthCaches();
};
