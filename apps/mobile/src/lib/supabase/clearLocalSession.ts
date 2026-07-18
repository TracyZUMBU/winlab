import { logger } from "@/src/lib/logger";

import { getSupabaseClient } from "./client";

/**
 * Clears only the local Supabase auth persistence (AsyncStorage).
 * Use when the refresh token is already invalid server-side, or as a
 * fallback after a failed global sign-out.
 */
export async function clearLocalSupabaseSession(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    logger.warn("[auth] clearLocalSupabaseSession failed", { error });
  }
}
