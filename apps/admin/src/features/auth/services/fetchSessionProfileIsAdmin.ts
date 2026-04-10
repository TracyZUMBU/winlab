import { getSupabaseClient } from "../../../lib/supabase";

export type SessionProfileAdminFields = {
  is_admin: boolean;
};

/**
 * Charge le flag `is_admin` du profil (RLS : uniquement la ligne de l’utilisateur connecté).
 */
export async function fetchSessionProfileIsAdmin(
  userId: string,
): Promise<
  | { ok: true; profile: SessionProfileAdminFields }
  | { ok: false; errorCode: "profile_fetch_failed" | "profile_not_found" }
> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, errorCode: "profile_fetch_failed" };
  }
  if (!data) {
    return { ok: false, errorCode: "profile_not_found" };
  }

  return {
    ok: true,
    profile: { is_admin: data.is_admin === true },
  };
}
