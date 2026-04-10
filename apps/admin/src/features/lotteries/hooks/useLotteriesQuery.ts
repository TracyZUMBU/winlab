import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { adminLotteriesListOptions } from "../queries/admin-lotteries-list.query";
import type { LotteryAdminListItem } from "../types/lotteryAdmin";

export type LotteriesQueryState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ok"; lotteries: LotteryAdminListItem[] };

export function useLotteriesQuery(): LotteriesQueryState {
  const query = useQuery({
    ...adminLotteriesListOptions(),
    enabled: isSupabaseConfigured,
  });

  if (!isSupabaseConfigured) {
    return {
      kind: "error",
      message:
        "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).",
    };
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

  const lotteries = query.data?.lotteries ?? [];
  if (lotteries.length === 0) {
    return { kind: "empty" };
  }

  return { kind: "ok", lotteries };
}
