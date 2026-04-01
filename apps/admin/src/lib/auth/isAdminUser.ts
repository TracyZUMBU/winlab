import type { User } from "@supabase/supabase-js";

/**
 * Emails autorisés pour le backoffice admin, depuis `VITE_ADMIN_EMAIL_ALLOWLIST`
 * (séparés par des virgules). Vide ou mal configuré → aucun accès (fail-closed).
 */
export function parseAdminEmailAllowlist(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAIL_ALLOWLIST?.trim() ?? "";
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/** Indique si l’utilisateur connecté est autorisé à utiliser l’admin (allowlist). */
export function isAdminUser(user: User | null): boolean {
  const email = user?.email?.trim().toLowerCase();
  if (!email) {
    return false;
  }
  const allowed = parseAdminEmailAllowlist();
  if (allowed.length === 0) {
    return false;
  }
  return allowed.includes(email);
}
