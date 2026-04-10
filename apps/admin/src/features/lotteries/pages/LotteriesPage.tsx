import { useMemo, useState } from "react";
import { LotteriesDevTable } from "../components/LotteriesDevTable";
import { useLotteriesQuery } from "../hooks/useLotteriesQuery";
import {
  LOTTERY_ADMIN_STATUSES,
  type LotteryAdminListItem,
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
  lotteries: LotteryAdminListItem[],
  titleSearchQuery: string,
  statusFilter: StatusFilterValue,
  sortId: LotteryListDevSortId,
): LotteryAdminListItem[] {
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
export function LotteriesPage() {
  const state = useLotteriesQuery();
  const [titleSearchQuery, setTitleSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(STATUS_FILTER_ALL);
  const [sortId, setSortId] = useState<LotteryListDevSortId>("draw_at_desc");

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
          </div>
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
