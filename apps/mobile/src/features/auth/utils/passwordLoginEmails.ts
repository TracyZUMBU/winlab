/**
 * Emails allowed to sign in with password (App Store review / seed accounts).
 * Source: EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS (comma-separated).
 * Never put passwords in env — only emails.
 */

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Parses a comma-separated list of emails into a normalized Set.
 * Empty / whitespace-only entries are dropped.
 */
export function parsePasswordLoginEmails(
  raw: string | undefined | null,
): ReadonlySet<string> {
  if (raw == null || raw.trim() === "") {
    return new Set();
  }

  const emails = raw
    .split(",")
    .map((part) => normalizeAuthEmail(part))
    .filter((email) => email.length > 0);

  return new Set(emails);
}

let cachedWhitelist: ReadonlySet<string> | null = null;

function getPasswordLoginEmailWhitelist(): ReadonlySet<string> {
  if (cachedWhitelist == null) {
    cachedWhitelist = parsePasswordLoginEmails(
      process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS,
    );
  }
  return cachedWhitelist;
}

/** @internal Test helper — resets the env-backed cache. */
export function resetPasswordLoginEmailWhitelistCacheForTests(): void {
  cachedWhitelist = null;
}

/**
 * True when this email may use password login instead of OTP.
 * Match is exact after trim + lowercase.
 */
export function isPasswordLoginEmail(email: string): boolean {
  const normalized = normalizeAuthEmail(email);
  if (normalized.length === 0) {
    return false;
  }
  return getPasswordLoginEmailWhitelist().has(normalized);
}
