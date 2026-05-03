import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "./client";
import { supabaseEnv } from "./env";

export type AuthSession = {
  session: Session | null;
  user: User | null;
};

export const getCurrentSession = async (): Promise<AuthSession> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
};

export const subscribeToAuthChanges = (
  callback: (session: Session | null) => void,
) => {
  if (!supabaseEnv.isConfigured) {
    callback(null);
    return () => undefined;
  }

  const supabase = getSupabaseClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    subscription.unsubscribe();
  };
};

