import { Link } from "react-router-dom";
import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { LotteryAdminListItem } from "../types/lotteryAdmin";

type LotteriesDevTableProps = {
  rows: LotteryAdminListItem[];
};

function formatTicketCost(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function LotteriesDevTable({ rows }: LotteriesDevTableProps) {
  return (
    <div className="lotteries-dev-table-wrap">
      <table className="lotteries-dev-table">
        <thead>
          <tr>
            <th scope="col">Titre</th>
            <th scope="col">Marque</th>
            <th scope="col">Statut</th>
            <th scope="col">Début</th>
            <th scope="col">Fin</th>
            <th scope="col">Tirage</th>
            <th scope="col">Coût ticket</th>
            <th scope="col">Gagnants</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="lotteries-dev-table__title">{row.title}</td>
              <td>{row.brand_name ?? "—"}</td>
              <td>
                <span
                  className={`lottery-status lottery-status--${row.status}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="lotteries-dev-table__mono">
                {formatDateTimeForDev(row.starts_at)}
              </td>
              <td className="lotteries-dev-table__mono">
                {formatDateTimeForDev(row.ends_at)}
              </td>
              <td className="lotteries-dev-table__mono">
                {formatDateTimeForDev(row.draw_at)}
              </td>
              <td className="lotteries-dev-table__num">
                {formatTicketCost(row.ticket_cost)}
              </td>
              <td className="lotteries-dev-table__num">
                {row.number_of_winners}
              </td>
              <td className="lotteries-dev-table__actions">
                <Link
                  to={`/lotteries/${row.id}`}
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
