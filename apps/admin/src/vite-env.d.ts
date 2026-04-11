/// <reference types="vite/client" />

/** Injectés par `vite.config.ts` (`define`). */
declare const __ADMIN_SUPABASE_URL__: string;
declare const __ADMIN_SUPABASE_ANON_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
