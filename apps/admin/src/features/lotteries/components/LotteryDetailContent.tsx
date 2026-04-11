import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { DetailState } from "../hooks/useLotteryAdminDetail";

function formatIntFr(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

type LotteryDetailContentProps = {
  state: DetailState;
  /** Pour le panneau : le titre est affiché dans la barre du panel. */
  hideTitleWhenOk?: boolean;
  headingId: string;
};

/** Corps du détail loterie (RPC `admin_get_lottery_detail`) — page ou panneau. */
export function LotteryDetailContent({
  state,
  hideTitleWhenOk = false,
  headingId,
}: LotteryDetailContentProps) {
  const generalSectionId = `${headingId}-general`;
  const ticketsSectionId = `${headingId}-tickets`;
  const winnersSectionId = `${headingId}-winners`;

  return (
    <>
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

      {state.kind === "not_found" && (
        <div className="page-lotteries__alert" role="status">
          Loterie introuvable (id invalide, supprimée, ou accès refusé par les politiques
          RLS sur la vue / tables sous-jacentes).
        </div>
      )}

      {state.kind === "ok" && (
        <>
          {!hideTitleWhenOk ? (
            <h2 id={headingId} className="page-lotteries__heading">
              {state.detail.title}
            </h2>
          ) : null}

          <section className="admin-detail-section" aria-labelledby={generalSectionId}>
            <h3 id={generalSectionId} className="admin-detail-section__title">
              Informations générales
            </h3>
            <dl className="admin-detail-dl">
              <div className="admin-detail-dl__row">
                <dt>ID</dt>
                <dd>
                  <code className="page-lottery-detail__code">{state.detail.lottery_id}</code>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Marque</dt>
                <dd>{state.detail.brand_name ?? "—"}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Statut</dt>
                <dd>
                  <span
                    className={`lottery-status lottery-status--${state.detail.status}`}
                  >
                    {state.detail.status}
                  </span>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Coût ticket</dt>
                <dd>{formatIntFr(state.detail.ticket_cost)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Places (prévu)</dt>
                <dd>{formatIntFr(state.detail.number_of_winners)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Mise en avant</dt>
                <dd>{state.detail.is_featured ? "Oui" : "Non"}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Catégorie</dt>
                <dd>{state.detail.category ?? "—"}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Slug</dt>
                <dd>{state.detail.slug ?? "—"}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Début</dt>
                <dd>{formatDateTimeForDev(state.detail.starts_at)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Fin</dt>
                <dd>{formatDateTimeForDev(state.detail.ends_at)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Tirage</dt>
                <dd>{formatDateTimeForDev(state.detail.draw_at)}</dd>
              </div>
            </dl>
            {state.detail.short_description && (
              <p className="admin-detail-text">
                <strong>Résumé</strong> — {state.detail.short_description}
              </p>
            )}
            {state.detail.description && (
              <p className="admin-detail-text admin-detail-text--multiline">
                <strong>Description</strong> — {state.detail.description}
              </p>
            )}
          </section>

          <section className="admin-detail-section" aria-labelledby={ticketsSectionId}>
            <h3 id={ticketsSectionId} className="admin-detail-section__title">
              Tickets
            </h3>
            <p className="admin-detail-summary">
              <strong>{formatIntFr(state.detail.tickets_count)}</strong> ticket(s) en base pour
              cette loterie.
            </p>
            {state.detail.tickets_count === 0 && (
              <p className="page-lotteries__muted">Aucun ticket enregistré.</p>
            )}
            <p className="page-lotteries__muted">
              Gagnants enregistrés (lignes <code>lottery_winners</code>) :{" "}
              <strong>{formatIntFr(state.detail.winners_count)}</strong>
            </p>
          </section>

          <section className="admin-detail-section" aria-labelledby={winnersSectionId}>
            <h3 id={winnersSectionId} className="admin-detail-section__title">
              Gagnants
            </h3>
            {state.detail.winners.length === 0 ? (
              <p className="page-lotteries__muted">
                Aucun gagnant enregistré (tirage non effectué ou pas encore de lignes en base).
              </p>
            ) : (
              <div className="admin-detail-winners-wrap">
                <table className="admin-detail-winners-table">
                  <thead>
                    <tr>
                      <th scope="col">Position</th>
                      <th scope="col">user_id</th>
                      <th scope="col">Pseudo</th>
                      <th scope="col">Email</th>
                      <th scope="col">ticket_id</th>
                      <th scope="col">Créé le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.detail.winners.map((w) => (
                      <tr key={`${w.ticket_id}-${w.position}`}>
                        <td className="admin-detail-winners-table__num">{w.position}</td>
                        <td>
                          <code className="admin-detail-winners-table__uuid">{w.user_id}</code>
                        </td>
                        <td>{w.username ?? "—"}</td>
                        <td>{w.email ?? "—"}</td>
                        <td>
                          <code className="admin-detail-winners-table__uuid">{w.ticket_id}</code>
                        </td>
                        <td className="lotteries-dev-table__mono">
                          {formatDateTimeForDev(w.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
