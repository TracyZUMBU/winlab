import { normalizeAuthEmail } from "./passwordLoginEmails";

/** Min delay between successful OTP sends for the same email (client-side). */
export const EMAIL_OTP_CLIENT_COOLDOWN_MS = 60_000;

const lastSuccessfulSendAtByEmail = new Map<string, number>();
const inFlightEmails = new Set<string>();

export function getEmailOtpCooldownRemainingMs(
  email: string,
  now = Date.now(),
): number {
  const key = normalizeAuthEmail(email);
  if (key.length === 0) return 0;
  const last = lastSuccessfulSendAtByEmail.get(key);
  if (last == null) return 0;
  return Math.max(0, last + EMAIL_OTP_CLIENT_COOLDOWN_MS - now);
}

export function isEmailOtpSendInFlight(email: string): boolean {
  const key = normalizeAuthEmail(email);
  if (key.length === 0) return false;
  return inFlightEmails.has(key);
}

/**
 * Returns true when this email may call Supabase signInWithOtp now.
 * Marks the email as in-flight until `releaseEmailOtpSendAttempt` is called.
 */
export function tryAcquireEmailOtpSend(email: string, now = Date.now()): boolean {
  const key = normalizeAuthEmail(email);
  if (key.length === 0) return false;
  if (inFlightEmails.has(key)) return false;
  if (getEmailOtpCooldownRemainingMs(key, now) > 0) return false;
  inFlightEmails.add(key);
  return true;
}

export function markEmailOtpSendSucceeded(email: string, now = Date.now()): void {
  const key = normalizeAuthEmail(email);
  if (key.length === 0) return;
  lastSuccessfulSendAtByEmail.set(key, now);
}

export function releaseEmailOtpSendAttempt(email: string): void {
  const key = normalizeAuthEmail(email);
  if (key.length === 0) return;
  inFlightEmails.delete(key);
}

/** @internal Test helper */
export function resetEmailOtpClientRateLimitForTests(): void {
  lastSuccessfulSendAtByEmail.clear();
  inFlightEmails.clear();
}
