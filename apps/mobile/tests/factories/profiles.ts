import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

/**
 * Met à jour `profiles.is_admin` (service role uniquement côté DB — trigger aligné).
 * À utiliser dans les tests d’intégration qui vérifient les RPC admin.
 */
export async function setProfileIsAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    // Colonne présente en base ; les types générés peuvent être en retard.
    .update({ is_admin: isAdmin } as Record<string, unknown>)
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
