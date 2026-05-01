import { clearDailyLoginLocalCache } from "@/src/features/missions/services/clearDailyLoginLocalCache";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  await clearDailyLoginLocalCache();
};
