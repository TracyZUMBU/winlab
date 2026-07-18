import { monitoring } from "@/src/lib/monitoring";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { supabaseEnv } from "@/src/lib/supabase/env";
import type {
  EmailOtpPayload,
  SendEmailOtpDiagnostic,
  SendEmailOtpErrorCode,
  SendEmailOtpResult,
} from "../types";
import {
  markEmailOtpSendSucceeded,
  releaseEmailOtpSendAttempt,
  tryAcquireEmailOtpSend,
} from "../utils/emailOtpClientRateLimit";

function getSupabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybe = error as Record<string, unknown>;
  const code = maybe.code;
  return typeof code === "string" && code.length > 0 ? code : undefined;
}

function isNetworkFetchFailure(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === "AuthRetryableFetchError") return true;
    if (error.message.toLowerCase().includes("network request failed")) {
      return true;
    }
  }
  return false;
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

function getSupabaseUrlHost(): string | undefined {
  try {
    return new URL(supabaseEnv.url).host;
  } catch {
    return undefined;
  }
}

function buildErrorDiagnosticFields(error: unknown): Pick<
  SendEmailOtpDiagnostic,
  "errorName" | "errorMessage" | "errorIsInstanceOfError" | "supabaseErrorCode"
> {
  const supabaseErrorCode = getSupabaseErrorCode(error);
  const errorName =
    error instanceof Error
      ? error.name
      : typeof error === "object" &&
          error !== null &&
          "name" in error &&
          typeof (error as { name?: unknown }).name === "string"
        ? (error as { name: string }).name
        : undefined;
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : undefined;

  return {
    supabaseErrorCode,
    errorName,
    errorMessage: errorMessage?.slice(0, 200),
    errorIsInstanceOfError: String(error instanceof Error),
  };
}

function monitoringExtraFromDiagnostic(
  diagnostic: SendEmailOtpDiagnostic,
  errorCode?: SendEmailOtpErrorCode,
): Record<string, string> {
  return {
    ...(errorCode ? { errorCode } : {}),
    branch: diagnostic.branch,
    connectivityProbe: diagnostic.connectivityProbe,
    supabaseConfigured: diagnostic.supabaseConfigured,
    errorIsInstanceOfError: diagnostic.errorIsInstanceOfError,
    ...(diagnostic.supabaseErrorCode
      ? { supabaseErrorCode: diagnostic.supabaseErrorCode }
      : {}),
    ...(diagnostic.errorName ? { errorName: diagnostic.errorName } : {}),
    ...(diagnostic.errorMessage
      ? { errorMessage: diagnostic.errorMessage }
      : {}),
    ...(diagnostic.connectivityHttpStatus
      ? { connectivityHttpStatus: diagnostic.connectivityHttpStatus }
      : {}),
    ...(diagnostic.connectivityErrorMessage
      ? { connectivityErrorMessage: diagnostic.connectivityErrorMessage }
      : {}),
    ...(diagnostic.supabaseUrlHost
      ? { supabaseUrlHost: diagnostic.supabaseUrlHost }
      : {}),
  };
}

async function probeSupabaseConnectivity(): Promise<
  Pick<
    SendEmailOtpDiagnostic,
    "connectivityProbe" | "connectivityHttpStatus" | "connectivityErrorMessage"
  >
> {
  if (!supabaseEnv.url) {
    return {
      connectivityProbe: "failed",
      connectivityErrorMessage: "missing_supabase_url",
    };
  }

  try {
    const healthUrl = `${supabaseEnv.url.replace(/\/$/, "")}/auth/v1/health`;
    const response = await fetch(healthUrl, { method: "GET" });
    const reachable = response.ok || response.status === 401;
    return {
      connectivityProbe: reachable ? "ok" : "failed",
      connectivityHttpStatus: String(response.status),
      ...(reachable
        ? {}
        : { connectivityErrorMessage: `unexpected_http_status_${response.status}` }),
    };
  } catch (probeError) {
    return {
      connectivityProbe: "failed",
      connectivityErrorMessage:
        probeError instanceof Error ? probeError.message : "probe_fetch_failed",
    };
  }
}

export const sendEmailOtp = async ({
  email,
  requestId,
}: EmailOtpPayload): Promise<SendEmailOtpResult> => {
  if (!tryAcquireEmailOtpSend(email)) {
    const diagnostic: SendEmailOtpDiagnostic = {
      branch: "client_rate_limited",
      connectivityProbe: "skipped",
      supabaseUrlHost: getSupabaseUrlHost(),
      supabaseConfigured: String(supabaseEnv.isConfigured),
      errorIsInstanceOfError: "false",
      errorName: "ClientRateLimited",
      errorMessage: "email_otp_client_cooldown",
    };

    monitoring.captureMessage({
      name: "auth_send_email_otp_user_error",
      severity: "warning",
      feature: "auth",
      requestId,
      message: "sendEmailOtp blocked by client cooldown",
      extra: monitoringExtraFromDiagnostic(diagnostic, "EMAIL_SEND_RATE_LIMITED"),
    });

    return {
      success: false,
      kind: "business",
      errorCode: "EMAIL_SEND_RATE_LIMITED",
      diagnostic,
    };
  }

  let baseDiagnostic: Omit<
    SendEmailOtpDiagnostic,
    "branch" | "errorName" | "errorMessage" | "errorIsInstanceOfError" | "supabaseErrorCode"
  > = {
    connectivityProbe: "skipped",
    supabaseUrlHost: getSupabaseUrlHost(),
    supabaseConfigured: String(supabaseEnv.isConfigured),
  };

  try {
    const supabase = getSupabaseClient();
    const connectivity = await probeSupabaseConnectivity();
    baseDiagnostic = {
      ...connectivity,
      supabaseUrlHost: getSupabaseUrlHost(),
      supabaseConfigured: String(supabaseEnv.isConfigured),
    };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (!error) {
      markEmailOtpSendSucceeded(email);
      return { success: true, data: undefined };
    }

    const supabaseErrorCode = getSupabaseErrorCode(error);
    const errorCode = mapSupabaseErrorCodeToAppErrorCode(supabaseErrorCode);
    const severity = getMonitoringSeverity(errorCode);
    const diagnostic: SendEmailOtpDiagnostic = {
      ...baseDiagnostic,
      branch: "supabase_error",
      ...buildErrorDiagnosticFields(error),
    };
    const monitoringExtra = monitoringExtraFromDiagnostic(diagnostic, errorCode);

    if (severity === "warning") {
      monitoring.captureMessage({
        name: "auth_send_email_otp_user_error",
        severity,
        feature: "auth",
        requestId,
        message: "sendEmailOtp returned a known user error",
        extra: monitoringExtra,
      });
    } else {
      monitoring.captureException({
        name: "auth_send_email_otp_failed",
        severity,
        feature: "auth",
        requestId,
        message: "sendEmailOtp failed (known incident/config or unknown)",
        error,
        extra: monitoringExtra,
      });
    }

    if (errorCode === "UNKNOWN_ERROR") {
      if (isNetworkFetchFailure(error)) {
        return { success: false, kind: "technical", diagnostic };
      }
      return { success: false, kind: "unexpected", diagnostic };
    }
    return {
      success: false,
      kind: "business",
      errorCode,
      diagnostic,
    };
  } catch (error) {
    const diagnostic: SendEmailOtpDiagnostic = {
      ...baseDiagnostic,
      branch: "caught_exception",
      ...buildErrorDiagnosticFields(error),
    };
    const monitoringExtra = monitoringExtraFromDiagnostic(
      diagnostic,
      "UNKNOWN_ERROR",
    );

    monitoring.captureException({
      name: "auth_send_email_otp_unexpected_exception",
      severity: "error",
      feature: "auth",
      requestId,
      message: "Unexpected exception while sending email OTP",
      error,
      extra: monitoringExtra,
    });

    return { success: false, kind: "technical", diagnostic };
  } finally {
    releaseEmailOtpSendAttempt(email);
  }
};
