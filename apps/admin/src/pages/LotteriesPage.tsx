import { useEffect, useState } from "react";
import { LotteriesDevTable } from "../features/lotteries/components/LotteriesDevTable";
import {
  getLotteries,
  type LotteryAdminListItem,
} from "../features/lotteries";
import { isSupabaseConfigured } from "../lib/supabase";

type LotteriesPageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ok"; lotteries: LotteryAdminListItem[] };

function initialState(): LotteriesPageState {
  if (!isSupabaseConfigured) {
    return {
      kind: "error",
      message:
        "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).",
    };
  }
  return { kind: "loading" };
}

/** Liste des loteries pour l’admin (outil dev). */
export function LotteriesPage() {
  const [state, setState] = useState<LotteriesPageState>(initialState);

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

  return (
    <section className="page-lotteries" aria-labelledby="lotteries-heading">
      <h2 id="lotteries-heading" className="page-lotteries__heading">
        Lotteries
      </h2>

      {state.kind === "loading" && (
        <p className="page-lotteries__muted" role="status">
          Chargement…
        </p>
      )}

      {state.kind === "error" && (
        <div className="page-lotteries__alert" role="alert">
          {state.message}
        </div>
      )}

      {state.kind === "empty" && (
        <p className="page-lotteries__muted" role="status">
          Aucune loterie renvoyée (liste vide ou accès refusé par les politiques
          RLS).
        </p>
      )}

      {state.kind === "ok" && <LotteriesDevTable rows={state.lotteries} />}
    </section>
  );
}
