import { getSupabaseClient } from "@/src/lib/supabase/client";

export type SignInWithEmailPasswordInput = {
  email: string;
  password: string;
};

/**
 * Email + password sign-in (Supabase Auth).
 * Used by the dev-only path on EmailScreen; production flow remains OTP.
 */
export const signInWithEmailPassword = async (
  input: SignInWithEmailPasswordInput,
) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("No user returned after sign-in");
  }

  return data.user;
};
