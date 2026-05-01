import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { LotteriesDevTable } from "../components/LotteriesDevTable";
import { LotteryDetailPanel } from "../components/LotteryDetailPanel";
import { useLotteriesQuery } from "../hooks/useLotteriesQuery";
import { lotteryServiceErrorMessage } from "../lotteryErrorMessages";
import { lotteryAdminKeys } from "../queries/lotteryAdmin.keys";
import { resetLotteriesScheduleForDev } from "../services/resetLotteriesScheduleForDev";
import {
  LOTTERY_ADMIN_STATUSES,
  type AdminLotteryListItem,
  type LotteryAdminStatus,
} from "../types/lotteryAdmin";

const STATUS_FILTER_ALL = "all" as const;

type StatusFilterValue = typeof STATUS_FILTER_ALL | LotteryAdminStatus;

type LotteryListDevSortId = "draw_at_desc" | "draw_at_asc" | "title_asc";

function compareDrawAtIso(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  const na = Number.isNaN(ta) ? 0 : ta;
  const nb = Number.isNaN(tb) ? 0 : tb;
  return na - nb;
}

/** Filtres + tri locaux (dev), sans requête supplémentaire. */
function applyLotteryListDevFilters(
  lotteries: AdminLotteryListItem[],
  titleSearchQuery: string,
  statusFilter: StatusFilterValue,
  sortId: LotteryListDevSortId,
): AdminLotteryListItem[] {
  const q = titleSearchQuery.trim().toLowerCase();
  let list = lotteries.filter((row) => {
    if (q && !row.title.toLowerCase().includes(q)) {
      return false;
    }
    if (statusFilter !== STATUS_FILTER_ALL && row.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const sorted = [...list];
  switch (sortId) {
    case "draw_at_desc":
      sorted.sort((a, b) => compareDrawAtIso(b.draw_at, a.draw_at));
      break;
    case "draw_at_asc":
      sorted.sort((a, b) => compareDrawAtIso(a.draw_at, b.draw_at));
      break;
    case "title_asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));
      break;
    default:
      break;
  }
  return sorted;
}

const SORT_OPTIONS: { id: LotteryListDevSortId; label: string }[] = [
  { id: "draw_at_desc", label: "Tirage (plus récent d’abord)" },
  { id: "draw_at_asc", label: "Tirage (plus ancien d’abord)" },
  { id: "title_asc", label: "Titre (A → Z)" },
];

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: STATUS_FILTER_ALL, label: "Tous les statuts" },
  ...LOTTERY_ADMIN_STATUSES.map((s) => ({ value: s, label: s })),
  { value: "unknown", label: "unknown" },
];

/** Liste des loteries pour l’admin (outil dev). */
const DETAIL_QUERY_KEY = "detail";

export function LotteriesPage() {
  const queryClient = useQueryClient();
  const state = useLotteriesQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [titleSearchQuery, setTitleSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(STATUS_FILTER_ALL);
  const [sortId, setSortId] = useState<LotteryListDevSortId>("draw_at_desc");
  const [isResettingLotteries, setIsResettingLotteries] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const detailLotteryId = searchParams.get(DETAIL_QUERY_KEY)?.trim() ?? "";

  const closeDetailPanel = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete(DETAIL_QUERY_KEY);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredLotteries = useMemo(() => {
    if (state.kind !== "ok") {
      return [];
    }
    return applyLotteryListDevFilters(
      state.lotteries,
      titleSearchQuery,
      statusFilter,
      sortId,
    );
  }, [state, titleSearchQuery, statusFilter, sortId]);

  const runDevResetLotteries = useCallback(async () => {
    // TODO(dev-reset-lotteries): supprimer ce bouton/action avant mise en production.
    if (!window.confirm("Réinitialiser les dates des loteries (action temporaire de dev) ?")) {
      return;
    }

    setIsResettingLotteries(true);
    setResetFeedback(null);

    const result = await resetLotteriesScheduleForDev();
    if (!result.success) {
      setResetFeedback({
        kind: "error",
        message: lotteryServiceErrorMessage(result.errorCode),
      });
      setIsResettingLotteries(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: lotteryAdminKeys.list() });
    setResetFeedback({
      kind: "success",
      message: `${result.data.updatedCount} loterie(s) non tirée(s) réinitialisée(s).`,
    });
    setIsResettingLotteries(false);
  }, [queryClient]);

  return (
    <section className="page-lotteries" aria-labelledby="lotteries-heading">
      {detailLotteryId ? (
        <LotteryDetailPanel lotteryId={detailLotteryId} onClose={closeDetailPanel} />
      ) : null}

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

      {state.kind === "ok" && (
        <>
          <div className="lotteries-dev-toolbar" role="search" aria-label="Filtres liste loteries">
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="lotteries-title-search">
                Titre
              </label>
              <input
                id="lotteries-title-search"
                className="lotteries-dev-toolbar__input"
                type="search"
                placeholder="Rechercher dans le titre…"
                value={titleSearchQuery}
                onChange={(e) => setTitleSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="lotteries-status-filter">
                Statut
              </label>
              <select
                id="lotteries-status-filter"
                className="lotteries-dev-toolbar__select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilterValue)
                }
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="lotteries-sort">
                Tri
              </label>
              <select
                id="lotteries-sort"
                className="lotteries-dev-toolbar__select"
                value={sortId}
                onChange={(e) => setSortId(e.target.value as LotteryListDevSortId)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lotteries-dev-toolbar__field lotteries-dev-toolbar__field--actions">
              <span className="lotteries-dev-toolbar__label">Actions dev</span>
              <button
                type="button"
                className="lotteries-dev-toolbar__danger-btn"
                onClick={() => {
                  void runDevResetLotteries();
                }}
                disabled={isResettingLotteries}
              >
                {isResettingLotteries ? "Réinitialisation…" : "Reset lotteries (dev)"}
              </button>
            </div>
          </div>
          {resetFeedback ? (
            <p
              className={
                resetFeedback.kind === "error"
                  ? "page-lotteries__alert page-lotteries__alert--inline"
                  : "page-lotteries__success"
              }
              role={resetFeedback.kind === "error" ? "alert" : "status"}
            >
              {resetFeedback.message}
            </p>
          ) : null}
          <p className="lotteries-dev-toolbar__hint" aria-live="polite">
            {filteredLotteries.length} affichée(s) sur {state.lotteries.length}
          </p>
          {filteredLotteries.length === 0 ? (
            <p className="page-lotteries__muted" role="status">
              Aucune loterie ne correspond à ces filtres.
            </p>
          ) : (
            <LotteriesDevTable rows={filteredLotteries} />
          )}
        </>
      )}
    </section>
  );
}
