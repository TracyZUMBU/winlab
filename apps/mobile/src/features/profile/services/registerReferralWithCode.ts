import { getSupabaseClient } from "@/src/lib/supabase/client";
import { monitoring } from "@/src/lib/monitoring";

export type RegisterReferralWithCodeResult =
  | { ok: true }
  | { ok: false; errorCode: string };

export async function registerReferralWithCode(
  rawCode: string,
): Promise<RegisterReferralWithCodeResult> {
  const trimmed = rawCode.trim();
  if (!trimmed) {
    return { ok: true };
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("register_referral_with_code", {
    p_code: trimmed,
  });

  if (error) {
    monitoring.captureException({
      name: "register_referral_with_code_rpc_failed",
      severity: "error",
      feature: "profile",
      message: "register_referral_with_code RPC failed",
      error,
    });
    return { ok: false, errorCode: "REFERRAL_RPC_FAILED" };
  }

  const rows = data ?? [];
  const row = rows[0];
  if (!row) {
    monitoring.captureMessage({
      name: "register_referral_with_code_empty_response",
      severity: "error",
      feature: "profile",
      message: "register_referral_with_code returned no row",
    });
    return { ok: false, errorCode: "REFERRAL_RPC_FAILED" };
  }

  if (!row.success) {
    return {
      ok: false,
      errorCode: row.error_code ?? "REFERRAL_UNKNOWN",
    };
  }

  return { ok: true };
}
