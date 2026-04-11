import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Valeurs injectées au build par Vite (`vite.config.ts` + `loadEnv`).
 * Sous Jest, les identifiants peuvent être absents → try/catch puis `process.env`.
 */
function tryBundledSupabaseUrl(): string {
  try {
    const v = __ADMIN_SUPABASE_URL__;
    if (typeof v === "string" && v.trim() !== "") {
      return v.trim();
    }
  } catch {
    /* Jest / exécution hors bundle Vite */
  }
  return (
    process.env.VITE_SUPABASE_URL?.trim() ??
    process.env.SUPABASE_URL?.trim() ??
    ""
  );
}

function tryBundledSupabaseAnonKey(): string {
  try {
    const v = __ADMIN_SUPABASE_ANON_KEY__;
    if (typeof v === "string" && v.trim() !== "") {
      return v.trim();
    }
  } catch {
    /* Jest / exécution hors bundle Vite */
  }
  return (
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ??
    process.env.SUPABASE_ANON_KEY?.trim() ??
    ""
  );
}

/** Indique si les variables d’URL et clé anon sont résolues. */
export function isSupabaseConfigured(): boolean {
  return Boolean(tryBundledSupabaseUrl() && tryBundledSupabaseAnonKey());
}

let client: SupabaseClient | null = null;

/**
 * Client Supabase **anon** pour le navigateur.
 * Ne jamais y mettre la clé service_role : elle ne doit pas être exposée côté front.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = tryBundledSupabaseUrl();
  const anonKey = tryBundledSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase non configuré : définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir apps/admin/.env.example).",
    );
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
