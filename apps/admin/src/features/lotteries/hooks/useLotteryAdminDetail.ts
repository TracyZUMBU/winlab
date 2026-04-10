import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { getLotteryAdminDetail } from "../services/getLotteryAdminDetail";
import type { LotteryAdminDetail } from "../types/lotteryAdminDetail";

export type DetailState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not_found" }
  | { kind: "ok"; detail: LotteryAdminDetail };

export function useLotteryAdminDetail(lotteryId: string | undefined): DetailState {
  const [state, setState] = useState<DetailState>({ kind: "idle" });

  useEffect(() => {
    const id = lotteryId?.trim() ?? "";
    if (!id) {
      setState({ kind: "not_found" });
      return;
    }

    if (!isSupabaseConfigured) {
      setState({
        kind: "error",
        message:
          "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env.",
      });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    void (async () => {
      try {
        const detail = await getLotteryAdminDetail(id);
        if (cancelled) {
          return;
        }
        if (!detail) {
          setState({ kind: "not_found" });
        } else {
          setState({ kind: "ok", detail });
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
  }, [lotteryId]);

  return state;
}
