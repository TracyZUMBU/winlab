import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { adminLotteryDetailOptions } from "../queries/admin-lottery-detail.query";
import type { LotteryAdminDetail } from "../types/lotteryAdminDetail";

export type DetailState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not_found" }
  | { kind: "ok"; detail: LotteryAdminDetail };

export function useLotteryAdminDetail(lotteryId: string | undefined): DetailState {
  const id = lotteryId?.trim() ?? "";

  const query = useQuery({
    ...adminLotteryDetailOptions(id),
    enabled: isSupabaseConfigured && id.length > 0,
  });

  if (!isSupabaseConfigured) {
    return {
      kind: "error",
      message:
        "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env.",
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
    const message =
      err instanceof Error ? err.message : "Erreur inconnue au chargement.";
    return { kind: "error", message };
  }

  const detail = query.data;
  if (!detail) {
    return { kind: "not_found" };
  }

  return { kind: "ok", detail };
}
