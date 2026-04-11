import { getSupabaseAdminClient } from "../supabaseTestClient";

/**
 * Met à jour `profiles.is_admin` (service role uniquement côté DB — trigger aligné).
 * À utiliser dans les tests d’intégration qui vérifient les RPC admin.
 */
export async function setProfileIsAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ is_admin: isAdmin } as never)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      `setProfileIsAdmin: no profile row was updated for userId=${userId} (missing profile or id mismatch)`,
    );
  }
}
