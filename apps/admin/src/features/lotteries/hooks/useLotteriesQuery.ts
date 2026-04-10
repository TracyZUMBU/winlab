import { useQuery } from "@tanstack/react-query";
import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { lotteryServiceErrorMessage } from "../lotteryErrorMessages";
import { adminLotteriesListOptions } from "../queries/admin-lotteries-list.query";
import type { AdminLotteryListItem } from "../types/lotteryAdmin";

export type LotteriesQueryState =
  | { kind: "loading" }
  | { kind: "error"; message: string; errorCode: string }
  | { kind: "empty" }
  | { kind: "ok"; lotteries: AdminLotteryListItem[] };

export function useLotteriesQuery(): LotteriesQueryState {
  const query = useQuery({
    ...adminLotteriesListOptions(),
    enabled: isSupabaseConfigured,
  });

  if (!isSupabaseConfigured) {
    return {
      kind: "error",
      errorCode: "CONFIGURATION",
      message: lotteryServiceErrorMessage("CONFIGURATION"),
    };
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

  const lotteries = query.data ?? [];
  if (lotteries.length === 0) {
    return { kind: "empty" };
  }

  return { kind: "ok", lotteries };
}
