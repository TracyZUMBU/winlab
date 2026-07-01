/// <reference types="vite/client" />

/** Injectés par `vite.config.ts` (`define`). */
declare const __ADMIN_SUPABASE_URL__: string;
declare const __ADMIN_SUPABASE_ANON_KEY__: string;
declare const __ADMIN_DEFAULT_LOTTERY_BRAND_ID__: string;

declare module "*.md?raw" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ADMIN_DEFAULT_LOTTERY_BRAND_ID?: string;
  /** Nom de la Edge Function qui relaie vers Slack (défaut: `monitoring-slack`). */
  readonly VITE_MONITORING_SLACK_EDGE_FUNCTION_NAME?: string;
}
