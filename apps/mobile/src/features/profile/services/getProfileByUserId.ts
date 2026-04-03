import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { Profile } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import { PROFILE_MVP_COLUMNS } from "./profileMvpColumns";

const PROFILES_TABLE = "profiles";

export async function getProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select(PROFILE_MVP_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? profileFromRow(data) : null;
}
