/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Emails autorisés pour l’admin, séparés par des virgules (trim + casse ignorée). */
  readonly VITE_ADMIN_EMAIL_ALLOWLIST?: string;
}
