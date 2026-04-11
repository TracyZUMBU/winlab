/// <reference types="vite/client" />

/** Injectés par `vite.config.ts` (`define`). */
declare const __ADMIN_SUPABASE_URL__: string;
declare const __ADMIN_SUPABASE_ANON_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Emails autorisés pour l’admin, séparés par des virgules (trim + casse ignorée). */
  readonly VITE_ADMIN_EMAIL_ALLOWLIST?: string;
}
