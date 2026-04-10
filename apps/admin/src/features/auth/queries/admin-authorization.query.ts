import type { User } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";

import { fetchSessionProfileIsAdmin } from "../services/fetchSessionProfileIsAdmin";
import { isAdminEmailAllowlist } from "../services/isAdminUser";
import { authKeys } from "./auth.keys";

export function computeAdminAllowed(user: User, profileIsAdmin: boolean | null): boolean {
  if (profileIsAdmin === true) {
    return true;
  }
  return isAdminEmailAllowlist(user);
}

export type AdminAuthorizationPayload = {
  allowed: boolean;
  profileIsAdmin: boolean | null;
};

async function fetchAdminAuthorization(user: User): Promise<AdminAuthorizationPayload> {
  const result = await fetchSessionProfileIsAdmin(user.id);
  const profileIsAdmin = result.ok ? result.profile.is_admin : null;
  return {
    allowed: computeAdminAllowed(user, profileIsAdmin),
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
