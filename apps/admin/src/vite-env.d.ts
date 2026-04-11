/// <reference types="vite/client" />

/** Injectés par `vite.config.ts` (`define`). */
declare const __ADMIN_SUPABASE_URL__: string;
declare const __ADMIN_SUPABASE_ANON_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Nom de la Edge Function qui relaie vers Slack (défaut: `monitoring-slack`). */
  readonly VITE_MONITORING_SLACK_EDGE_FUNCTION_NAME?: string;
  /** Optionnel — branchement futur Sentry (provider encore no-op dans `@winlab/monitoring`). */
  readonly VITE_SENTRY_DSN?: string;
}
