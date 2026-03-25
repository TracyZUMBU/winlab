import { useEffect, useState } from "react";

import { getCurrentSession } from "@/src/lib/supabase/session";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";

import type { AuthSessionData } from "../types";

export const useAuthSession = (): AuthSessionData => {
  const [state, setState] = useState<AuthSessionData>({
    status: "loading",
    session: null,
    user: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { session, user } = await getCurrentSession();
        if (!isMounted) return;

        setState({
          status: user ? "authenticated" : "unauthenticated",
          session,
          user,
        });
      } catch (error) {
        if (!isMounted) return;
        // UX unchanged: failed session read => treat as signed out.
        logger.warn(
          "[auth] useAuthSession: getCurrentSession failed; treating as unauthenticated",
          { error },
        );
        monitoring.captureException({
          name: "auth_session_initial_load_failed",
          severity: "warning",
          feature: "auth",
          message:
            "getCurrentSession failed on hook mount; UX fallback unauthenticated",
          error,
          extra: { action: "getCurrentSession" },
        });
        setState({
          status: "unauthenticated",
          session: null,
          user: null,
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

