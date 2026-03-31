import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/** Indique si les variables publiques Vite sont renseignées (pas de validation d’URL au-delà). */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/**
 * Client Supabase **anon** pour le navigateur.
 * Ne jamais y mettre la clé service_role : elle ne doit pas être exposée côté front.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase non configuré : définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir apps/admin/.env.example).",
    );
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
