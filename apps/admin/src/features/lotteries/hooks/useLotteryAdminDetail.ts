import { useQuery } from "@tanstack/react-query";
import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { lotteryServiceErrorMessage } from "../lotteryErrorMessages";
import { adminLotteryDetailOptions } from "../queries/admin-lottery-detail.query";
import type { AdminLotteryDetail } from "../types/lotteryAdmin";

export type DetailState =
  | { kind: "loading" }
  | { kind: "error"; message: string; errorCode: string }
  | { kind: "not_found" }
  | { kind: "ok"; detail: AdminLotteryDetail };

export function useLotteryAdminDetail(lotteryId: string | undefined): DetailState {
  const id = lotteryId?.trim() ?? "";

  const query = useQuery({
    ...adminLotteryDetailOptions(id),
    enabled: isSupabaseConfigured() && id.length > 0,
  });

  if (!isSupabaseConfigured()) {
    return {
      kind: "error",
      errorCode: "CONFIGURATION",
      message: lotteryServiceErrorMessage("CONFIGURATION"),
    };
  }

  if (!id) {
    return { kind: "not_found" };
  }

  if (query.isPending) {
    return { kind: "loading" };
  }

  if (query.isError) {
    const err = query.error;
    if (err instanceof ServiceFailureError) {
      return {
        kind: "error",
        errorCode: err.errorCode,
        message: lotteryServiceErrorMessage(err.errorCode),
      };
    }
    return {
      kind: "error",
      errorCode: "UNKNOWN",
      message: lotteryServiceErrorMessage("UNKNOWN"),
    };
  }

  const detail = query.data;
  if (!detail) {
    return { kind: "not_found" };
  }

  return { kind: "ok", detail };
}
