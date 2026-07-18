/**
 * Detects Supabase Auth failures where the persisted refresh token is no longer
 * usable server-side (revoked, rotated, or missing). Local session must be cleared.
 */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };

  if (candidate.code === "refresh_token_not_found") {
    return true;
  }

  if (typeof candidate.message !== "string") {
    return false;
  }

  const message = candidate.message.toLowerCase();
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}
