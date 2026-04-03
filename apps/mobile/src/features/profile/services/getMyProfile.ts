import { getSupabaseClient } from "@/src/lib/supabase/client";

import type { Profile } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import { PROFILE_MVP_COLUMNS } from "./profileMvpColumns";

/**
 * Profil de l’utilisateur connecté : à appeler avec `user.id` depuis la session.
 */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_MVP_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? profileFromRow(data) : null;
}
