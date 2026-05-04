import { monitoring } from "@/src/lib/monitoring";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import type {
  EmailOtpPayload,
  SendEmailOtpErrorCode,
  SendEmailOtpResult,
} from "../types";

function getSupabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybe = error as Record<string, unknown>;
  const code = maybe.code;
  return typeof code === "string" && code.length > 0 ? code : undefined;
}

function mapSupabaseErrorCodeToAppErrorCode(
  supabaseErrorCode?: string,
): SendEmailOtpErrorCode {
  switch (supabaseErrorCode) {
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "EMAIL_SEND_RATE_LIMITED";
    case "captcha_failed":
      return "CAPTCHA_FAILED";
    case "email_address_invalid":
      return "EMAIL_INVALID";
    case "signup_disabled":
      return "SIGNUP_DISABLED";
    case "email_provider_disabled":
    case "provider_disabled":
      return "EMAIL_PROVIDER_DISABLED";
    case "email_address_not_authorized":
      return "EMAIL_NOT_AUTHORIZED";
    default:
      return "UNKNOWN_ERROR";
  }
}

function getMonitoringSeverity(
  errorCode: SendEmailOtpErrorCode,
): "warning" | "error" {
  switch (errorCode) {
    case "EMAIL_SEND_RATE_LIMITED":
    case "CAPTCHA_FAILED":
    case "EMAIL_INVALID":
      return "warning";
    case "SIGNUP_DISABLED":
    case "EMAIL_PROVIDER_DISABLED":
    case "EMAIL_NOT_AUTHORIZED":
    case "UNKNOWN_ERROR":
      return "error";
  }
}

export const sendEmailOtp = async ({
  email,
  requestId,
}: EmailOtpPayload): Promise<SendEmailOtpResult> => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (!error) return { success: true, data: undefined };

    const supabaseErrorCode = getSupabaseErrorCode(error);
    const errorCode = mapSupabaseErrorCodeToAppErrorCode(supabaseErrorCode);
    const severity = getMonitoringSeverity(errorCode);

    if (severity === "warning") {
      monitoring.captureMessage({
        name: "auth_send_email_otp_user_error",
        severity,
        feature: "auth",
        requestId,
        message: "sendEmailOtp returned a known user error",
        extra: {
          errorCode,
          supabaseErrorCode: supabaseErrorCode ?? "unknown",
        },
      });
    } else {
      monitoring.captureException({
        name: "auth_send_email_otp_failed",
        severity,
        feature: "auth",
        requestId,
        message: "sendEmailOtp failed (known incident/config or unknown)",
        error,
        extra: {
          errorCode,
          supabaseErrorCode: supabaseErrorCode ?? "unknown",
        },
      });
    }

    if (errorCode === "UNKNOWN_ERROR") {
      return { success: false, kind: "unexpected" };
    }
    return {
      success: false,
      kind: "business",
      errorCode,
    };
  } catch (error) {
    // Unexpected technical failure (network, SDK, etc.)
    monitoring.captureException({
      name: "auth_send_email_otp_unexpected_exception",
      severity: "error",
      feature: "auth",
      requestId,
      message: "Unexpected exception while sending email OTP",
      error,
      extra: {
        errorCode: "UNKNOWN_ERROR",
      },
    });

    return { success: false, kind: "technical" };
  }
};
