import { getSupabaseClient } from "@/src/lib/supabase/client";
import { insertProfileWithReferralRetry } from "@/src/lib/supabase/insertProfileWithReferralRetry";
import type { CreateProfilePayload, Profile } from "../types/profileTypes";

const PROFILES_TABLE = "profiles";

export const createProfile = async ({
  userId,
  email,
  username,
}: CreateProfilePayload): Promise<Profile> => {
  const supabase = getSupabaseClient();

  return insertProfileWithReferralRetry(async () => {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .insert({
        id: userId,
        email,
        username,
      })
      .select("*")
      .single();

    return { data, error };
  });
};
