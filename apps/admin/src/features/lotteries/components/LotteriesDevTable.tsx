import { Link } from "react-router-dom";
import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { AdminLotteryListItem } from "../types/lotteryAdmin";

type LotteriesDevTableProps = {
  rows: AdminLotteryListItem[];
};

/** Fenêtre « bientôt » : 48 h à partir de maintenant (même référence que les dates affichées). */
const ENDING_SOON_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export type LotteryEndHighlight = "none" | "ended" | "ending_soon";

/** Compare `ends_at` au moment courant ; `ended` prime sur `ending_soon`. */
export function getLotteryEndHighlight(
  endsAt: string | null,
  nowMs: number = Date.now(),
): LotteryEndHighlight {
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

function formatTicketCost(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

/** Comptages vue admin : null / indéfini → « — », 0 affiché explicitement, séparateurs fr-FR. */
function formatCountForDev(value: number | null | undefined): string {
  if (value == null || typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.trunc(value));
}

function countCellClass(value: number | null | undefined): string {
  const base = "lotteries-dev-table__num";
  if (value == null || typeof value !== "number" || Number.isNaN(value)) {
    return `${base} lotteries-dev-table__count-muted`;
  }
  if (Math.trunc(value) === 0) {
    return `${base} lotteries-dev-table__count-zero`;
  }
  return base;
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
            <th scope="col">Tickets</th>
            <th scope="col">Places</th>
            <th scope="col">Tirés</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const endHighlight = getLotteryEndHighlight(row.ends_at);
            const rowMod =
              endHighlight === "ended"
                ? "lotteries-dev-table__row--ended"
                : endHighlight === "ending_soon"
                  ? "lotteries-dev-table__row--ending-soon"
                  : "";

            return (
            <tr
              key={row.lottery_id}
              className={rowMod ? rowMod : undefined}
            >
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
              <td className="lotteries-dev-table__mono">
                {formatDateTimeForDev(row.draw_at)}
              </td>
              <td className="lotteries-dev-table__num">
                {formatTicketCost(row.ticket_cost)}
              </td>
              <td className={countCellClass(row.tickets_count)}>
                {formatCountForDev(row.tickets_count)}
              </td>
              <td className="lotteries-dev-table__num">
                {row.number_of_winners}
              </td>
              <td className={countCellClass(row.winners_count)}>
                {formatCountForDev(row.winners_count)}
              </td>
              <td className="lotteries-dev-table__actions">
                <Link
                  to={`/lotteries/${row.lottery_id}`}
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
