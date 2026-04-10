import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";

export type CurrentUserState =
  | { status: "loading" }
  | { status: "ready"; user: User | null };

/**
 * Session Supabase Auth (persistée par défaut en localStorage côté navigateur).
 * `loading` jusqu’à la première résolution de session.
 */
export function useCurrentUser(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ status: "loading" });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ status: "ready", user: null });
      return;
    }

    const supabase = getSupabaseClient();

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setState({ status: "ready", user: session?.user ?? null });
      })
      .catch(() => {
        setState({ status: "ready", user: null });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ status: "ready", user: session?.user ?? null });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
