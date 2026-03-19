import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { Profile } from "../types/profileTypes";

const PROFILES_TABLE = "profiles";

export const getProfileByUserId = async (
  userId: string,
): Promise<Profile | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};
