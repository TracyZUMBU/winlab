import { getSupabaseClient } from "@/src/lib/supabase/client";
import { monitoring } from "@/src/lib/monitoring";

export type GrantSignupBonusResult =
  | { ok: true; alreadyGranted: false; amount: number }
  | { ok: true; alreadyGranted: true; amount: number }
  | { ok: false; errorCode: string };

type RpcRow = {
  success: boolean;
  already_granted: boolean;
  amount: number;
  error_code: string | null;
};

export async function grantSignupBonus(): Promise<GrantSignupBonusResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("grant_signup_bonus");

  if (error) {
    monitoring.captureException({
      name: "grant_signup_bonus_rpc_failed",
      severity: "critical",
      feature: "profile",
      message: "grant_signup_bonus RPC failed after profile creation",
      error,
    });
    return { ok: false, errorCode: "SIGNUP_BONUS_RPC_FAILED" };
  }

  const rows = data as RpcRow[] | null;
  const row = rows?.[0];
  if (!row) {
    monitoring.captureMessage({
      name: "grant_signup_bonus_empty_response",
      severity: "critical",
      feature: "profile",
      message: "grant_signup_bonus returned no row after profile creation",
    });
    return { ok: false, errorCode: "SIGNUP_BONUS_EMPTY_RESPONSE" };
  }

  if (!row.success) {
    monitoring.captureMessage({
      name: "grant_signup_bonus_business_failure",
      severity: "critical",
      feature: "profile",
      message: "grant_signup_bonus returned success=false after profile creation",
      extra: {
        errorCode: row.error_code ?? "null",
      },
    });
    return {
      ok: false,
      errorCode: row.error_code ?? "SIGNUP_BONUS_UNKNOWN",
    };
  }

  if (row.already_granted) {
    return { ok: true, alreadyGranted: true, amount: row.amount };
  }

  return { ok: true, alreadyGranted: false, amount: row.amount };
}
