import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { VerifyOtpPayload, VerifyOtpResult } from "../types";
import { OTP_CODE_LENGTH } from "../constants/authConstants";

export const verifyEmailOtp = async ({
  email,
  token,
}: VerifyOtpPayload): Promise<VerifyOtpResult> => {
  const supabase = getSupabaseClient();

  if (token.length !== OTP_CODE_LENGTH) {
    return {
      success: false,
      errorCode: "OTP_INVALID_LENGTH",
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
      errorCode: "OTP_VERIFICATION_FAILED",
    };
  }

  return {
    success: true,
    user: data.session.user,
  };
};
