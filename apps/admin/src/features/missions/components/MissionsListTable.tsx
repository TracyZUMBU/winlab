import { Link } from "react-router-dom";

import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { AdminMissionListItem } from "../types/missionAdmin";

type MissionsListTableProps = {
  rows: AdminMissionListItem[];
};

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
          {rows.map((row) => (
            <tr key={row.mission_id}>
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
              <td className="lotteries-dev-table__mono">
                {formatDateTimeForDev(row.ends_at)}
              </td>
              <td className="lotteries-dev-table__num">{formatCount(row.total_completions)}</td>
              <td className="lotteries-dev-table__actions">
                <Link
                  to={`/missions/${encodeURIComponent(row.mission_id)}`}
                  className="lotteries-dev-table__detail-link"
                >
                  Voir le détail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
