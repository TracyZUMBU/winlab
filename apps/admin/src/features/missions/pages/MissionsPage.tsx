import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { MissionsListTable } from "../components/MissionsListTable";
import { useAdminMissionsListQuery } from "../hooks/useAdminMissionsListQuery";
import { missionServiceErrorMessage } from "../missionErrorMessages";
import { adminBrandFilterOptionsQuery } from "../queries/admin-brand-filter-options.query";
import {
  MISSION_ADMIN_LIST_SORT_IDS,
  MISSION_ADMIN_STATUSES,
  MISSION_ADMIN_TYPES,
  type AdminMissionsListQueryInput,
  type MissionAdminKnownStatus,
  type MissionAdminKnownType,
  type MissionAdminListSortId,
} from "../types/missionAdmin";

const STATUS_FILTER_ALL = "all" as const;
type StatusFilterValue = typeof STATUS_FILTER_ALL | MissionAdminKnownStatus;

const TYPE_FILTER_ALL = "all" as const;
type TypeFilterValue = typeof TYPE_FILTER_ALL | MissionAdminKnownType;

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const SORT_LABELS: Record<MissionAdminListSortId, string> = {
  created_at_desc: "Création (récent d’abord)",
  created_at_asc: "Création (ancien d’abord)",
  starts_at_desc: "Début (récent d’abord)",
  starts_at_asc: "Début (ancien d’abord)",
  ends_at_desc: "Fin (récent d’abord)",
  ends_at_asc: "Fin (ancien d’abord)",
  title_asc: "Titre (A → Z)",
  title_desc: "Titre (Z → A)",
  token_reward_desc: "Récompense (plus haute)",
  token_reward_asc: "Récompense (plus basse)",
  total_completions_desc: "Complétions (plus nombreuses)",
  total_completions_asc: "Complétions (moins nombreuses)",
};

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: STATUS_FILTER_ALL, label: "Tous les statuts" },
  ...MISSION_ADMIN_STATUSES.map((s) => ({ value: s, label: s })),
];

const TYPE_FILTER_OPTIONS: { value: TypeFilterValue; label: string }[] = [
  { value: TYPE_FILTER_ALL, label: "Tous les types" },
  ...MISSION_ADMIN_TYPES.map((t) => ({ value: t, label: t })),
];

function statusToQueryStatus(
  v: StatusFilterValue,
): AdminMissionsListQueryInput["status"] {
  return v === STATUS_FILTER_ALL ? STATUS_FILTER_ALL : v;
}

function typeToQueryType(
  v: TypeFilterValue,
): AdminMissionsListQueryInput["missionType"] {
  return v === TYPE_FILTER_ALL ? TYPE_FILTER_ALL : v;
}

export function MissionsPage() {
  const [titleSearch, setTitleSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(STATUS_FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(TYPE_FILTER_ALL);
  const [sort, setSort] = useState<MissionAdminListSortId>("created_at_desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const brandsQuery = useQuery({
    ...adminBrandFilterOptionsQuery(),
    enabled: isSupabaseConfigured(),
  });

  const listInput = useMemo((): AdminMissionsListQueryInput => {
    const brand = brandId.trim();
    return {
      titleSearch,
      brandId: brand === "" ? null : brand,
      status: statusToQueryStatus(statusFilter),
      missionType: typeToQueryType(typeFilter),
      limit: pageSize,
      offset: pageIndex * pageSize,
      sort,
    };
  }, [titleSearch, brandId, statusFilter, typeFilter, pageSize, pageIndex, sort]);

  const listState = useAdminMissionsListQuery(listInput);

  const total = listState.kind === "ok" ? listState.data.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPageIndex(0);
  }, [titleSearch, brandId, statusFilter, typeFilter, sort, pageSize]);

  useEffect(() => {
    const maxIdx = Math.max(0, Math.ceil(total / pageSize) - 1);
    if (pageIndex > maxIdx) {
      setPageIndex(maxIdx);
    }
  }, [total, pageSize, pageIndex]);

  const missions = listState.kind === "ok" ? listState.data.missions : [];
  const fromIdx = total === 0 ? 0 : pageIndex * pageSize + 1;
  const toIdx = total === 0 ? 0 : Math.min(total, pageIndex * pageSize + missions.length);

  return (
    <section className="page-missions" aria-labelledby="missions-heading">
      <h2 id="missions-heading" className="page-missions__heading">
        Missions
      </h2>

      {listState.kind === "loading" && (
        <p className="page-lotteries__muted" role="status">
          Chargement…
        </p>
      )}

      {listState.kind === "error" && (
        <div className="page-lotteries__alert" role="alert">
          {listState.message}
        </div>
      )}

      {listState.kind === "ok" && (
        <>
          <div className="lotteries-dev-toolbar" role="search" aria-label="Filtres liste missions">
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-title-search">
                Titre
              </label>
              <input
                id="missions-title-search"
                className="lotteries-dev-toolbar__input"
                type="search"
                placeholder="Rechercher dans le titre…"
                value={titleSearch}
                onChange={(e) => setTitleSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-brand-filter">
                Marque
              </label>
              <select
                id="missions-brand-filter"
                className="lotteries-dev-toolbar__select"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                disabled={brandsQuery.isPending}
              >
                <option value="">Toutes les marques</option>
                {brandsQuery.isSuccess
                  ? brandsQuery.data.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  : null}
              </select>
              {brandsQuery.isError ? (
                <span className="missions-toolbar__field-hint" role="note">
                  {brandsQuery.error instanceof ServiceFailureError
                    ? missionServiceErrorMessage(brandsQuery.error.errorCode)
                    : missionServiceErrorMessage("RPC_ERROR")}
                </span>
              ) : null}
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-status-filter">
                Statut
              </label>
              <select
                id="missions-status-filter"
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
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-type-filter">
                Type
              </label>
              <select
                id="missions-type-filter"
                className="lotteries-dev-toolbar__select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilterValue)}
              >
                {TYPE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-sort">
                Tri
              </label>
              <select
                id="missions-sort"
                className="lotteries-dev-toolbar__select"
                value={sort}
                onChange={(e) => setSort(e.target.value as MissionAdminListSortId)}
              >
                {MISSION_ADMIN_LIST_SORT_IDS.map((id) => (
                  <option key={id} value={id}>
                    {SORT_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div className="lotteries-dev-toolbar__field">
              <label className="lotteries-dev-toolbar__label" htmlFor="missions-page-size">
                Par page
              </label>
              <select
                id="missions-page-size"
                className="lotteries-dev-toolbar__select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="lotteries-dev-toolbar__hint" aria-live="polite">
            {total === 0
              ? "Aucune mission ne correspond à ces filtres."
              : `Affichage ${fromIdx}–${toIdx} sur ${total} mission(s) — page ${pageIndex + 1} / ${totalPages}`}
          </p>

          {total === 0 ? null : (
            <>
              <MissionsListTable rows={missions} />
              <div className="missions-pagination" role="navigation" aria-label="Pagination">
                <button
                  type="button"
                  className="missions-pagination__btn"
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                >
                  Page précédente
                </button>
                <button
                  type="button"
                  className="missions-pagination__btn"
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() =>
                    setPageIndex((i) => Math.min(totalPages - 1, i + 1))
                  }
                >
                  Page suivante
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
