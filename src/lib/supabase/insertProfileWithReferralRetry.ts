import type { PostgrestError } from "@supabase/supabase-js";

/** Postgres unique constraint on profiles.referral_code */
export const PROFILES_REFERRAL_CODE_UNIQUE_CONSTRAINT =
  "profiles_referral_code_unique";

/**
 * Race: two inserts can still collide after the trigger's NOT EXISTS check.
 * Retry only for that constraint.
 */
export function isProfileReferralCodeUniqueViolation(
  error: PostgrestError,
): boolean {
  if (error.code !== "23505") {
    return false;
  }
  const blob = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ");
  return blob.includes(PROFILES_REFERRAL_CODE_UNIQUE_CONSTRAINT);
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

    if (error && isProfileReferralCodeUniqueViolation(error)) {
      lastError = error;
      continue;
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
