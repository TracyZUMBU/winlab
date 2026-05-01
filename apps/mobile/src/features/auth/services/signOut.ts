import { clearDailyLoginLocalCache } from "@/src/features/missions/services/clearDailyLoginLocalCache";
import {
  clearPendingDailyLoginUiOverride,
  invalidateAppBootstrapCache,
} from "@/src/lib/bootstrap/sharedAppBootstrap";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  clearPendingDailyLoginUiOverride();
  invalidateAppBootstrapCache();
  await clearDailyLoginLocalCache();
};
