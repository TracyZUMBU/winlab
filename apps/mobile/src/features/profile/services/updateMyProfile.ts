import { getSupabaseClient } from "@/src/lib/supabase/client";

import type { Profile, UpdateMyProfileInput } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import { PROFILE_MVP_COLUMNS } from "./profileMvpColumns";

const PROFILES_TABLE = "profiles";

export async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<Profile> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .update({ username: input.username })
    .eq("id", user.id)
    .select(PROFILE_MVP_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return profileFromRow(data);
}
