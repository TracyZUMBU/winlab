import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import {
  adminAuthorizationOptions,
  computeAdminAllowed,
} from "../queries/admin-authorization.query";

export type AdminAuthorizationState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      allowed: boolean;
      /** Présent si la lecture profil a réussi (utile pour debug / évolutions). */
      profileIsAdmin: boolean | null;
    };

/**
 * Après session résolue : charge `profiles.is_admin` puis combine avec l’allowlist (transition).
 */
export function useAdminAuthorization(
  user: User | null,
): AdminAuthorizationState {
  const query = useQuery(adminAuthorizationOptions(user));

  if (!user) {
    return { status: "idle" };
  }

  if (query.isPending) {
    return { status: "loading" };
  }

  const profileIsAdmin = query.data?.profileIsAdmin ?? null;

  return {
    status: "ready",
    allowed: query.data?.allowed ?? computeAdminAllowed(user, null),
    profileIsAdmin,
  };
}
