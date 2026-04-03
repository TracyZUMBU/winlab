import type { PostgrestError } from "@supabase/supabase-js";

import { CreateProfileError } from "../types/profileTypes";

/** Postgres unique constraint on profiles.referral_code */
const PROFILES_REFERRAL_CODE_UNIQUE_CONSTRAINT =
  "profiles_referral_code_unique";

/** Unique index on profiles.username */
const PROFILES_USERNAME_KEY = "profiles_username_key";

/**
 * Race: two inserts can still collide after the trigger's NOT EXISTS check.
 * Retry only for that constraint.
 */
function isProfileReferralCodeUniqueViolation(error: PostgrestError): boolean {
  if (error.code !== "23505") {
    return false;
  }
  const blob = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ");
  return blob.includes(PROFILES_REFERRAL_CODE_UNIQUE_CONSTRAINT);
}

export function isProfileUsernameUniqueViolation(
  error: PostgrestError,
): boolean {
  if (error.code !== "23505") {
    return false;
  }
  const blob = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ");
  return blob.includes(PROFILES_USERNAME_KEY);
}

type InsertResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Retries profile INSERT when referral_code unique constraint fails (rare race).
 */
export async function insertProfileWithReferralRetry<T>(
  runInsert: () => Promise<InsertResult<T>>,
  maxAttempts = 5,
): Promise<T> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await runInsert();

    if (!error && data !== null) {
      return data;
    }

    if (!error && data === null) {
      throw new Error("Profile insert returned no data without an error");
    }

    if (error && isProfileReferralCodeUniqueViolation(error)) {
      lastError = error;
      continue;
    }

    if (error && isProfileUsernameUniqueViolation(error)) {
      throw new CreateProfileError("USERNAME_TAKEN");
    }

    if (error) {
      throw error;
    }
  }

  throw (
    lastError ??
    new Error("Profile insert failed: exhausted referral_code retry attempts")
  );
}
