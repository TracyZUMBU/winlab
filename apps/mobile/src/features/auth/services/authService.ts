import { getSupabaseClient } from "@/src/lib/supabase/client";
import type {
  EmailOtpPayload,
  VerifyOtpPayload,
  VerifyOtpResult,
} from "../types";
import { OTP_CODE_LENGTH } from "../constants/authConstants";

export const sendEmailOtp = async ({ email }: EmailOtpPayload) => {
  const supabase = getSupabaseClient();

  const { error, data } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: undefined,
    },
  });
  console.log("data", data);
  if (error) {
    throw error;
  }

  return true;
};

export const verifyEmailOtp = async ({
  email,
  token,
}: VerifyOtpPayload): Promise<VerifyOtpResult> => {
  const supabase = getSupabaseClient();

  if (token.length !== OTP_CODE_LENGTH) {
    return {
      success: false,
      errorMessage: `Le code doit contenir ${OTP_CODE_LENGTH} chiffres.`,
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.session || !data.session.user) {
    return {
      success: false,
      errorMessage:
        error?.message ??
        "Le code est invalide ou a expiré. Merci de réessayer.",
    };
  }

  return {
    success: true,
    user: data.session.user,
  };
};

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
