import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { CreateProfilePayload, Profile } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import {
  insertProfileWithReferralRetry,
  isProfileUsernameUniqueViolation,
} from "./insertProfileWithReferralRetry";
import { monitoring } from "@/src/lib/monitoring";

const PROFILES_TABLE = "profiles";

export const createProfile = async ({
  userId,
  email,
  username,
  birth_date,
  sex,
}: CreateProfilePayload): Promise<Profile> => {
  const supabase = getSupabaseClient();

  return insertProfileWithReferralRetry(async () => {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .insert({
        id: userId,
        email,
        username,
        birth_date,
        sex,
      })
      .select("*")
      .single();
    if (error) {
      if (isProfileUsernameUniqueViolation(error)) {
        monitoring.captureMessage({
          name: "create_profile_username_taken",
          severity: "warning",
          feature: "profile",
          message: "Profile create rejected: username already taken",
        });
      } else {
        monitoring.captureException({
          name: "create_profile_failed",
          severity: "error",
          feature: "profile",
          message: "Failed to create profile",
          error,
        });
      }
    }
    return {
      data: data ? profileFromRow(data) : null,
      error,
    };
  });
};
