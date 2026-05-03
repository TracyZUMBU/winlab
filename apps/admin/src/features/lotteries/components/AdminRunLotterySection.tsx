import { useCallback, useEffect, useMemo, useState } from "react";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { lotteryServiceErrorMessage } from "../lotteryErrorMessages";
import { useRunAdminLottery } from "../hooks/useRunAdminLottery";
import type { AdminLotteryDetail } from "../types/lotteryAdmin";

function parseIsoMs(iso: string | null): number | null {
  if (!iso?.trim()) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function timingBlockReason(detail: AdminLotteryDetail): string | null {
  const now = Date.now();
  const drawAt = parseIsoMs(detail.draw_at);
  if (drawAt !== null && drawAt > now) {
    return "La date de tirage (`draw_at`) n’est pas encore atteinte.";
  }
  const endsAt = parseIsoMs(detail.ends_at);
  if (endsAt !== null && endsAt > now) {
    return "La date de fin (`ends_at`) n’est pas encore atteinte.";
  }
  return null;
}

type AdminRunLotterySectionProps = {
  detail: AdminLotteryDetail;
};

/**
 * Action « exécuter le tirage » : uniquement pour les loteries au statut `closed` ;
 * les prérequis temporels sont contrôlés côté serveur ; l’UI désactive le bouton à titre indicatif.
 */
export function AdminRunLotterySection({ detail }: AdminRunLotterySectionProps) {
  const mutation = useRunAdminLottery();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    mutation.reset();
    setLocalError(null);
  }, [detail.lottery_id, mutation.reset]);

  const timingHint = useMemo(() => timingBlockReason(detail), [detail]);

  const canOfferRun = detail.status === "closed";

  const runLottery = useCallback(async () => {
    setLocalError(null);
    const ok = window.confirm(
      "Confirmer l’exécution du tirage ? Cette opération est définitive : les gagnants seront enregistrés et la loterie passera au statut « drawn ».",
    );
    if (!ok) return;

    try {
      await mutation.mutateAsync(detail.lottery_id);
    } catch (e) {
      if (e instanceof ServiceFailureError) {
        setLocalError(lotteryServiceErrorMessage(e.errorCode));
        return;
      }
      setLocalError(lotteryServiceErrorMessage("UNKNOWN"));
    }
  }, [detail.lottery_id, mutation]);

  if (detail.status === "drawn") {
    return (
      <section
        className="admin-detail-section admin-run-lottery"
        aria-labelledby="admin-run-lottery-drawn-heading"
      >
        <h3 id="admin-run-lottery-drawn-heading" className="admin-detail-section__title">
          Tirage
        </h3>
        <p className="page-lotteries__muted">
          Cette loterie est déjà au statut « drawn ». Aucune nouvelle exécution n’est possible depuis
          l’admin.
        </p>
      </section>
    );
  }

  if (!canOfferRun) {
    return (
      <section
        className="admin-detail-section admin-run-lottery"
        aria-labelledby="admin-run-lottery-na-heading"
      >
        <h3 id="admin-run-lottery-na-heading" className="admin-detail-section__title">
          Tirage
        </h3>
        <p className="page-lotteries__muted">
          Le tirage automatique n’est proposé que lorsque la loterie est au statut « closed ». Statut
          actuel : <strong>{detail.status}</strong>.
        </p>
      </section>
    );
  }

  const buttonDisabled =
    mutation.isPending || Boolean(timingHint);

  return (
    <section
      className="admin-detail-section admin-run-lottery"
      aria-labelledby="admin-run-lottery-heading"
    >
      <h3 id="admin-run-lottery-heading" className="admin-detail-section__title">
        Tirage
      </h3>
      <p className="admin-detail-text">
        Exécute la fonction <code className="page-lottery-detail__code">run_lottery</code> pour cette
        loterie (tickets actifs éligibles, positions aléatoires, puis statut <code className="page-lottery-detail__code">drawn</code>
        ).
      </p>
      {timingHint ? (
        <p className="page-lotteries__alert page-lotteries__alert--inline" role="status">
          {timingHint}
        </p>
      ) : null}
      {localError ? (
        <p className="page-lotteries__alert" role="alert">
          {localError}
        </p>
      ) : null}
      {mutation.isSuccess ? (
        <p className="page-lotteries__success" role="status">
          Tirage exécuté.{" "}
          <strong>{mutation.data.winnerTicketIds.length}</strong> ticket(s) gagnant(s) dans cette
          exécution (rafraîchissement des données en cours).
        </p>
      ) : null}
      <div className="admin-run-lottery__actions">
        <button
          type="button"
          className="admin-run-lottery__submit"
          onClick={runLottery}
          disabled={buttonDisabled}
          title={timingHint ?? undefined}
        >
          {mutation.isPending ? "Tirage en cours…" : "Exécuter le tirage"}
        </button>
      </div>
    </section>
  );
}
