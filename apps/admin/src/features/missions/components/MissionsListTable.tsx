import { Link } from "react-router-dom";

import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { AdminMissionListItem } from "../types/missionAdmin";

type MissionsListTableProps = {
  rows: AdminMissionListItem[];
};

/** Fenêtre « bientôt » : 48 h (même référence que la liste loteries). */
const ENDING_SOON_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export type MissionEndHighlight = "none" | "ended" | "ending_soon";

/** Compare `ends_at` au moment courant ; `ended` prime sur `ending_soon`. */
export function getMissionEndHighlight(
  endsAt: string | null,
  nowMs: number = Date.now(),
): MissionEndHighlight {
  if (endsAt == null || endsAt === "") {
    return "none";
  }
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) {
    return "none";
  }
  if (end < nowMs) {
    return "ended";
  }
  if (end <= nowMs + ENDING_SOON_WINDOW_MS) {
    return "ending_soon";
  }
  return "none";
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.trunc(value));
}

export function MissionsListTable({ rows }: MissionsListTableProps) {
  return (
    <div className="lotteries-dev-table-wrap">
      <table className="lotteries-dev-table">
        <thead>
          <tr>
            <th scope="col">Titre</th>
            <th scope="col">Marque</th>
            <th scope="col">Type</th>
            <th scope="col">Statut</th>
            <th scope="col">Récompense</th>
            <th scope="col">Validation</th>
            <th scope="col">Début</th>
            <th scope="col">Fin</th>
            <th scope="col">Complétions</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const endHighlight = getMissionEndHighlight(row.ends_at);
            const rowMod =
              endHighlight === "ended"
                ? "lotteries-dev-table__row--ended"
                : endHighlight === "ending_soon"
                  ? "lotteries-dev-table__row--ending-soon"
                  : "";

            return (
              <tr
                key={row.mission_id}
                className={rowMod ? rowMod : undefined}
              >
                <td className="lotteries-dev-table__title">{row.title}</td>
                <td>{row.brand_name ?? "—"}</td>
                <td>
                  <span className={`mission-type mission-type--${row.mission_type}`}>
                    {row.mission_type}
                  </span>
                </td>
                <td>
                  <span className={`mission-status mission-status--${row.status}`}>
                    {row.status}
                  </span>
                </td>
                <td className="lotteries-dev-table__num">{formatTokens(row.token_reward)}</td>
                <td>
                  <span
                    className={`mission-validation mission-validation--${row.validation_mode}`}
                  >
                    {row.validation_mode}
                  </span>
                </td>
                <td className="lotteries-dev-table__mono">
                  {formatDateTimeForDev(row.starts_at)}
                </td>
                <td
                  className={[
                    "lotteries-dev-table__mono",
                    "lotteries-dev-table__end-cell",
                    endHighlight !== "none"
                      ? `lotteries-dev-table__end-cell--${endHighlight}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="lotteries-dev-table__end-cell-stack">
                    <span className="lotteries-dev-table__end-date">
                      {formatDateTimeForDev(row.ends_at)}
                    </span>
                    {endHighlight === "ended" ? (
                      <span
                        className="lotteries-dev-table__end-chip lotteries-dev-table__end-chip--ended"
                        title="Date de fin dépassée"
                      >
                        Terminée
                      </span>
                    ) : null}
                    {endHighlight === "ending_soon" ? (
                      <span
                        className="lotteries-dev-table__end-chip lotteries-dev-table__end-chip--soon"
                        title="Se termine dans les 48 prochaines heures"
                      >
                        ≤ 2 jours
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="lotteries-dev-table__num">{formatCount(row.total_completions)}</td>
                <td className="lotteries-dev-table__actions">
                  <Link
                    to={{
                      pathname: "/missions",
                      search: `?detail=${encodeURIComponent(row.mission_id)}`,
                    }}
                    className="lotteries-dev-table__detail-link"
                  >
                    Voir le détail
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
