import { monitoring } from "@/src/lib/monitoring";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { VerifyOtpPayload, VerifyOtpResult } from "../types";
import { OTP_CODE_LENGTH } from "../constants/authConstants";

export const verifyEmailOtp = async ({
  email,
  token,
  requestId,
}: VerifyOtpPayload): Promise<VerifyOtpResult> => {
  const supabase = getSupabaseClient();

  if (token.length !== OTP_CODE_LENGTH) {
    monitoring.captureMessage({
      name: "auth_verify_email_otp_invalid_length",
      severity: "warning",
      feature: "auth",
      requestId,
      message: "verifyEmailOtp rejected because token length is invalid",
      extra: {
        otpLength: String(token.length),
        expectedOtpLength: String(OTP_CODE_LENGTH),
      },
    });
    return {
      success: false,
      kind: "business",
      errorCode: "OTP_INVALID_LENGTH",
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.session || !data.session.user) {
    monitoring.captureException({
      name: "auth_verify_email_otp_failed",
      severity: "warning",
      feature: "auth",
      requestId,
      message: "verifyEmailOtp failed or returned no user session",
      error: error ?? new Error("verifyEmailOtp returned no session user"),
    });
    return {
      success: false,
      kind: "business",
      errorCode: "OTP_VERIFICATION_FAILED",
    };
  }

  monitoring.captureMessage({
    name: "auth_verify_email_otp_success",
    severity: "info",
    feature: "auth",
    requestId,
    message: "verifyEmailOtp succeeded",
  });

  return {
    success: true,
    data: { user: data.session.user },
  };
};
