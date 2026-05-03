import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";

const FN_ADMIN_RUN_LOTTERY = "admin-run-lottery";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RunAdminLotteryInput = {
  lotteryId: string;
};

export type RunAdminLotteryData = {
  winnerTicketIds: string[];
};

type InvokeOkBody = {
  success?: unknown;
  winner_ticket_ids?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapEdgeErrorToCode(raw: string): string {
  switch (raw) {
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "PROFILE_CHECK_FAILED":
      return "PROFILE_CHECK_FAILED";
    case "METHOD_NOT_ALLOWED":
      return "METHOD_NOT_ALLOWED";
    case "SERVER_MISCONFIGURED":
      return "SERVER_MISCONFIGURED";
    case "INVALID_JSON":
      return "INVALID_JSON";
    case "INVALID_LOTTERY_ID":
      return "INVALID_LOTTERY_ID";
    case "LOTTERY_NOT_FOUND":
    case "LOTTERY_ALREADY_DRAWN":
    case "LOTTERY_CANCELLED":
    case "LOTTERY_DRAFT":
    case "LOTTERY_NOT_CLOSED":
    case "LOTTERY_DRAW_NOT_READY":
    case "LOTTERY_NOT_ENDED":
      return raw;
    case "RUN_LOTTERY_RPC_FAILED":
      return "RUN_LOTTERY_RPC_FAILED";
    default:
      return "EDGE_UNKNOWN";
  }
}

async function readInvokeErrorBody(error: unknown): Promise<string | null> {
  if (!isRecord(error)) return null;
  const ctx = error.context;
  if (!(ctx instanceof Response)) return null;
  try {
    const json: unknown = await ctx.json();
    if (!isRecord(json)) return null;
    const err = json.error;
    return typeof err === "string" ? err : null;
  } catch {
    return null;
  }
}

function normalizeWinnerIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

/**
 * Exécute le tirage d’une loterie (`run_lottery`) via l’Edge Function sécurisée admin.
 */
export async function runAdminLottery(
  input: RunAdminLotteryInput,
): Promise<ServiceResult<RunAdminLotteryData>> {
  if (!isSupabaseConfigured()) {
    return { success: false, errorCode: "CONFIGURATION" };
  }

  const lotteryId = input.lotteryId.trim();
  if (!UUID_RE.test(lotteryId)) {
    return { success: false, errorCode: "INVALID_LOTTERY_ID" };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke<InvokeOkBody>(
      FN_ADMIN_RUN_LOTTERY,
      {
        body: { lottery_id: lotteryId },
      },
    );

    if (error) {
      const edgeErr = await readInvokeErrorBody(error);
      if (edgeErr) {
        return { success: false, errorCode: mapEdgeErrorToCode(edgeErr) };
      }
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    if (!data || data.success !== true) {
      return { success: false, errorCode: "EDGE_UNKNOWN" };
    }

    return {
      success: true,
      data: {
        winnerTicketIds: normalizeWinnerIds(data.winner_ticket_ids),
      },
    };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
