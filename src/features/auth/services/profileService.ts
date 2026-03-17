import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { CreateProfilePayload, Profile } from "../types";

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

export const createProfile = async ({
  userId,
  email,
  username,
}: CreateProfilePayload): Promise<Profile> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .insert({
      id: userId,
      email,
      username,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
};
