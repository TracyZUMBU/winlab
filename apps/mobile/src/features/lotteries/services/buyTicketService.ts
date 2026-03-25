import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { ErrorKind } from "@/src/lib/errors/errorKinds";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";

export type BuyTicketParams = {
  lotteryId: string;
};

export type BuyTicketBusinessErrorCode =
  | "UNAUTHENTICATED"
  | "LOTTERY_NOT_FOUND"
  | "LOTTERY_NOT_PURCHASABLE"
  | "LOTTERY_NOT_STARTED"
  | "LOTTERY_EXPIRED"
  | "LOTTERY_DRAW_ALREADY_STARTED"
  | "INSUFFICIENT_TOKENS";

export type BuyTicketResult =
  | { success: true; ticketId: string }
  | { success: false; kind: "business"; errorCode: BuyTicketBusinessErrorCode }
  | { success: false; kind: Exclude<ErrorKind, "business"> };

type BuyTicketRpcRow = {
  success: boolean;
  ticket_id: string | null;
  error_code: string | null;
};

const BUSINESS_ERROR_CODES = new Set<BuyTicketBusinessErrorCode>([
  "UNAUTHENTICATED",
  "LOTTERY_NOT_FOUND",
  "LOTTERY_NOT_PURCHASABLE",
  "LOTTERY_NOT_STARTED",
  "LOTTERY_EXPIRED",
  "LOTTERY_DRAW_ALREADY_STARTED",
  "INSUFFICIENT_TOKENS",
]);

export async function buyTicket({
  lotteryId,
}: BuyTicketParams): Promise<BuyTicketResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("buy_ticket", {
    p_lottery_id: lotteryId,
  });

  if (error) {
    logger.warn("[lotteries] buy_ticket RPC failed", {
      lotteryId,
      error,
    });
    monitoring.captureException({
      name: "buy_ticket_rpc_failed",
      severity: "error",
      feature: "lotteries",
      message: "buy_ticket RPC failed",
      error,
      extra: { lotteryId },
    });
    return { success: false, kind: "technical" };
  }

  if (!Array.isArray(data) || data.length !== 1) {
    const err = new Error("buy_ticket invalid server response (expected 1 row)");
    logger.warn("[lotteries] buy_ticket invalid server response", {
      lotteryId,
      dataType: typeof data,
    });
    monitoring.captureException({
      name: "buy_ticket_invalid_server_response",
      severity: "error",
      feature: "lotteries",
      message: err.message,
      error: err,
      extra: { lotteryId },
    });
    return { success: false, kind: "unexpected" };
  }

  const row = data[0] as BuyTicketRpcRow | null | undefined;
  if (!row || typeof row.success !== "boolean") {
    const err = new Error("buy_ticket invalid server response (missing fields)");
    logger.warn("[lotteries] buy_ticket invalid server response", {
      lotteryId,
    });
    monitoring.captureException({
      name: "buy_ticket_invalid_server_response",
      severity: "error",
      feature: "lotteries",
      message: err.message,
      error: err,
      extra: { lotteryId },
    });
    return { success: false, kind: "unexpected" };
  }

  if (row.success) {
    if (typeof row.ticket_id !== "string" || row.ticket_id.length === 0) {
      const err = new Error("buy_ticket invalid server response (missing ticket_id)");
      logger.warn("[lotteries] buy_ticket invalid server response", {
        lotteryId,
      });
      monitoring.captureException({
        name: "buy_ticket_invalid_server_response",
        severity: "error",
        feature: "lotteries",
        message: err.message,
        error: err,
        extra: { lotteryId },
      });
      return { success: false, kind: "unexpected" };
    }

    return { success: true, ticketId: row.ticket_id };
  }

  if (typeof row.error_code !== "string" || row.error_code.length === 0) {
    const err = new Error("buy_ticket invalid server response (missing error_code)");
    logger.warn("[lotteries] buy_ticket invalid server response", {
      lotteryId,
    });
    monitoring.captureException({
      name: "buy_ticket_invalid_server_response",
      severity: "error",
      feature: "lotteries",
      message: err.message,
      error: err,
      extra: { lotteryId },
    });
    return { success: false, kind: "unexpected" };
  }

  const code = row.error_code as BuyTicketBusinessErrorCode;
  if (!BUSINESS_ERROR_CODES.has(code)) {
    const err = new Error(`buy_ticket unknown business error_code: ${row.error_code}`);
    logger.warn("[lotteries] buy_ticket unknown error_code", {
      lotteryId,
      errorCode: row.error_code,
    });
    monitoring.captureException({
      name: "buy_ticket_unknown_error_code",
      severity: "error",
      feature: "lotteries",
      message: err.message,
      error: err,
      extra: { lotteryId, errorCode: row.error_code },
    });
    return { success: false, kind: "unexpected" };
  }

  return { success: false, kind: "business", errorCode: code };
}
