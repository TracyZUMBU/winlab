import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../lib/supabase";

/**
 * Utilisateur courant depuis la session Supabase Auth (lecture initiale).
 */
export async function getAuthUserFromSession(): Promise<User | null> {
  const { data: { session }, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }
  return session?.user ?? null;
}
