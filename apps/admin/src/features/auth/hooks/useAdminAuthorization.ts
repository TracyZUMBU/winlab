import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { fetchSessionProfileIsAdmin } from "../services/fetchSessionProfileIsAdmin";
import { isAdminEmailAllowlist } from "../services/isAdminUser";

export type AdminAuthorizationState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      allowed: boolean;
      /** Présent si la lecture profil a réussi (utile pour debug / évolutions). */
      profileIsAdmin: boolean | null;
    };

function computeAllowed(user: User, profileIsAdmin: boolean | null): boolean {
  if (profileIsAdmin === true) {
    return true;
  }
  return isAdminEmailAllowlist(user);
}

/**
 * Après session résolue : charge `profiles.is_admin` puis combine avec l’allowlist (transition).
 */
export function useAdminAuthorization(
  user: User | null,
): AdminAuthorizationState {
  const [state, setState] = useState<AdminAuthorizationState>({
    status: "idle",
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    void (async () => {
      const result = await fetchSessionProfileIsAdmin(user.id);
      if (cancelled) {
        return;
      }
      const profileIsAdmin = result.ok ? result.profile.is_admin : null;
      setState({
        status: "ready",
        allowed: computeAllowed(user, profileIsAdmin),
        profileIsAdmin,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return state;
}
