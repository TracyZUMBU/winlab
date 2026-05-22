import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { CreateProfilePayload, Profile } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import {
  insertProfileWithReferralRetry,
  isProfileUsernameUniqueViolation,
} from "./insertProfileWithReferralRetry";
import { normalizeProfileLocation } from "../utils/normalizeProfileLocation";
import { PROFILE_MVP_COLUMNS } from "./profileMvpColumns";
import { monitoring } from "@/src/lib/monitoring";

const PROFILES_TABLE = "profiles";

export const createProfile = async ({
  userId,
  email,
  username,
  birth_date,
  sex,
  residence_country,
  department_code,
}: CreateProfilePayload): Promise<Profile> => {
  const supabase = getSupabaseClient();
  const location = normalizeProfileLocation(
    residence_country,
    department_code,
  );

  return insertProfileWithReferralRetry(async () => {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .insert({
        id: userId,
        email,
        username,
        birth_date,
        sex,
        residence_country: location.residence_country,
        department_code: location.department_code,
      })
      .select(PROFILE_MVP_COLUMNS)
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
