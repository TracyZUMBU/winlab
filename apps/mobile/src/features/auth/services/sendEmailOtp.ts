import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { EmailOtpPayload } from "../types";

export const sendEmailOtp = async ({ email }: EmailOtpPayload) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    throw error;
  }

  return true;
};
