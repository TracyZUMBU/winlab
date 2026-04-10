import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";
import { authKeys } from "../queries/auth.keys";
import { getAuthUserFromSession } from "../services/getAuthUserFromSession";

export type CurrentUserState =
  | { status: "loading" }
  | { status: "ready"; user: User | null };

/**
 * Session Supabase Auth (persistée par défaut en localStorage côté navigateur).
 * `loading` jusqu’à la première résolution de session.
 * Le cache est synchronisé avec `onAuthStateChange` (connexion / déconnexion).
 */
export function useCurrentUser(): CurrentUserState {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: authKeys.session(),
    queryFn: getAuthUserFromSession,
    enabled: isSupabaseConfigured,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData<User | null>(authKeys.session(), session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  if (!isSupabaseConfigured) {
    return { status: "ready", user: null };
  }

  if (query.isPending) {
    return { status: "loading" };
  }

  return { status: "ready", user: query.data ?? null };
}
