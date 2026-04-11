import { formatDateTimeForDev } from "../../../lib/formatDateTimeForDev";
import type { MissionDetailState } from "../hooks/useMissionAdminDetail";

function formatIntFr(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

type MissionDetailContentProps = {
  state: MissionDetailState;
  headingId: string;
};

/** Corps du détail mission (RPC `admin_get_mission_detail`). */
export function MissionDetailContent({ state, headingId }: MissionDetailContentProps) {
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
          Mission introuvable (identifiant invalide, mission supprimée, ou accès refusé).
        </div>
      )}

      {state.kind === "ok" && (
        <>
          <h2 id={headingId} className="page-missions__heading">
            {state.detail.title}
          </h2>

          <section className="admin-detail-section" aria-labelledby="mission-detail-general">
            <h3 id="mission-detail-general" className="admin-detail-section__title">
              Informations générales
            </h3>
            <dl className="admin-detail-dl">
              <div className="admin-detail-dl__row">
                <dt>ID mission</dt>
                <dd>
                  <code className="page-lottery-detail__code">{state.detail.mission_id}</code>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Marque</dt>
                <dd>{state.detail.brand_name ?? "—"}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>ID marque</dt>
                <dd>
                  <code className="page-lottery-detail__code">{state.detail.brand_id}</code>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Type</dt>
                <dd>
                  <span className={`mission-type mission-type--${state.detail.mission_type}`}>
                    {state.detail.mission_type}
                  </span>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Statut</dt>
                <dd>
                  <span className={`mission-status mission-status--${state.detail.status}`}>
                    {state.detail.status}
                  </span>
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Récompense (jetons)</dt>
                <dd>{formatIntFr(state.detail.token_reward)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Validation</dt>
                <dd>
                  <span
                    className={`mission-validation mission-validation--${state.detail.validation_mode}`}
                  >
                    {state.detail.validation_mode}
                  </span>
                </dd>
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
                <dt>Max complétions (total)</dt>
                <dd>
                  {state.detail.max_completions_total == null
                    ? "—"
                    : formatIntFr(state.detail.max_completions_total)}
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Max complétions / utilisateur</dt>
                <dd>{formatIntFr(state.detail.max_completions_per_user)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Créée le</dt>
                <dd className="lotteries-dev-table__mono">
                  {formatDateTimeForDev(state.detail.created_at)}
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Mise à jour</dt>
                <dd className="lotteries-dev-table__mono">
                  {formatDateTimeForDev(state.detail.updated_at)}
                </dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Illustration</dt>
                <dd>
                  {state.detail.image_url ? (
                    <a
                      href={state.detail.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lotteries-dev-table__detail-link"
                    >
                      Ouvrir l’URL
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
            {state.detail.description ? (
              <p className="admin-detail-text admin-detail-text--multiline">
                <strong>Description</strong> — {state.detail.description}
              </p>
            ) : null}
          </section>

          <section className="admin-detail-section" aria-labelledby="mission-detail-aggregates">
            <h3 id="mission-detail-aggregates" className="admin-detail-section__title">
              Complétions (agrégats)
            </h3>
            <dl className="admin-detail-dl">
              <div className="admin-detail-dl__row">
                <dt>Total</dt>
                <dd>{formatIntFr(state.detail.total_completions)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>En attente</dt>
                <dd>{formatIntFr(state.detail.pending_completions)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Approuvées</dt>
                <dd>{formatIntFr(state.detail.approved_completions)}</dd>
              </div>
              <div className="admin-detail-dl__row">
                <dt>Rejetées</dt>
                <dd>{formatIntFr(state.detail.rejected_completions)}</dd>
              </div>
            </dl>
            <p className="page-lotteries__muted">
              Liste des utilisateurs : au moins une complétion (tous statuts). Pas de pagination
              des lignes de complétion en V1.
            </p>
          </section>

          <section className="admin-detail-section" aria-labelledby="mission-detail-users">
            <h3 id="mission-detail-users" className="admin-detail-section__title">
              Utilisateurs ayant complété
            </h3>
            {state.detail.completed_users.length === 0 ? (
              <p className="page-lotteries__muted">Aucun utilisateur en base pour cette mission.</p>
            ) : (
              <div className="admin-detail-winners-wrap">
                <table className="admin-detail-winners-table">
                  <thead>
                    <tr>
                      <th scope="col">Pseudo</th>
                      <th scope="col">user_id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.detail.completed_users.map((u) => (
                      <tr key={u.user_id}>
                        <td>{u.username}</td>
                        <td>
                          <code className="admin-detail-winners-table__uuid">{u.user_id}</code>
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
