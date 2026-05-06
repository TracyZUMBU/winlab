import type { PostgrestError } from "@supabase/supabase-js";

function messageFromUnknown(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "";
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  const msg = messageFromUnknown(error);
  if (/failed to fetch|networkerror|load failed|fetch/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Mappe une erreur Supabase / réseau vers un code stable pour l’UI.
 * `WINLAB_ADMIN_REQUIRED` → `UNAUTHORIZED`
 */
export function mapSupabaseToErrorCode(error: unknown): string {
  const msg = messageFromUnknown(error);

  if (msg.includes("WINLAB_ADMIN_REQUIRED")) {
    return "UNAUTHORIZED";
  }
  if (msg.includes("WINLAB_INVALID_LOTTERY_ID")) {
    return "INVALID_LOTTERY_ID";
  }
  if (msg.includes("WINLAB_INVALID_MISSION_ID")) {
    return "INVALID_MISSION_ID";
  }

  if (/row-level security/i.test(msg)) {
    return "FORBIDDEN";
  }

  if (isLikelyNetworkError(error)) {
    return "NETWORK";
  }

  if (isPostgrestError(error) || msg.length > 0) {
    return "RPC_ERROR";
  }

  return "UNKNOWN";
}
