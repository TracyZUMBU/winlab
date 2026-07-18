import { isInvalidRefreshTokenError } from "@/src/lib/supabase/authErrors";
import { clearLocalSupabaseSession } from "@/src/lib/supabase/clearLocalSession";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { logger } from "@/src/lib/logger";

export const signOut = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    await clearLocalSupabaseSession();

    if (isInvalidRefreshTokenError(error)) {
      logger.warn(
        "[auth] global signOut failed with invalid refresh token; local session cleared",
        { error },
      );
      return;
    }

    logger.warn("[auth] global signOut failed", { error });
    throw error;
  }
};
