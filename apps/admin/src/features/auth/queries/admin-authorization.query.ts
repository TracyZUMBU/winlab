import type { User } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";

import { fetchSessionProfileIsAdmin } from "../services/fetchSessionProfileIsAdmin";
import { authKeys } from "./auth.keys";

/** Accès UI admin : uniquement si le profil a `is_admin = true` (aligné sur les RPC côté DB). */
export function computeAdminAllowed(profileIsAdmin: boolean | null): boolean {
  return profileIsAdmin === true;
}

export type AdminAuthorizationPayload = {
  allowed: boolean;
  profileIsAdmin: boolean | null;
};

async function fetchAdminAuthorization(user: User): Promise<AdminAuthorizationPayload> {
  const result = await fetchSessionProfileIsAdmin(user.id);
  const profileIsAdmin = result.ok ? result.profile.is_admin : null;
  return {
    allowed: computeAdminAllowed(profileIsAdmin),
    profileIsAdmin,
  };
}

export function adminAuthorizationOptions(user: User | null) {
  const userId = user?.id;
  return queryOptions({
    queryKey: authKeys.adminAuthorization(userId ?? ""),
    queryFn: () => fetchAdminAuthorization(user!),
    enabled: Boolean(userId),
  });
}
