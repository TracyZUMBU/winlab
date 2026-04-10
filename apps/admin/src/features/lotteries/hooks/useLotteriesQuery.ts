import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { getLotteries } from "../services/getLotteries";
import type { LotteryAdminListItem } from "../types/lotteryAdmin";

export type LotteriesQueryState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ok"; lotteries: LotteryAdminListItem[] };

function initialLotteriesQueryState(): LotteriesQueryState {
  if (!isSupabaseConfigured) {
    return {
      kind: "error",
      message:
        "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).",
    };
  }
  return { kind: "loading" };
}

export function useLotteriesQuery(): LotteriesQueryState {
  const [state, setState] = useState<LotteriesQueryState>(initialLotteriesQueryState);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { lotteries } = await getLotteries();
        if (cancelled) {
          return;
        }
        if (lotteries.length === 0) {
          setState({ kind: "empty" });
        } else {
          setState({ kind: "ok", lotteries });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Erreur inconnue au chargement.";
        setState({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
