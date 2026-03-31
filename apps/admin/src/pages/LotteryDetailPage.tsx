import { Link, useParams } from "react-router-dom";

/** Détail loterie — données à brancher à l’étape suivante. */
export function LotteryDetailPage() {
  const { lotteryId } = useParams<{ lotteryId: string }>();

  return (
    <section className="page-lottery-detail" aria-labelledby="lottery-detail-heading">
      <p className="page-lottery-detail__back">
        <Link to="/lotteries">← Retour à la liste</Link>
      </p>
      <h2 id="lottery-detail-heading" className="page-lotteries__heading">
        Détail loterie
      </h2>
      <p className="page-lottery-detail__id">
        <span className="page-lottery-detail__label">ID</span>{" "}
        <code className="page-lottery-detail__code">{lotteryId ?? "—"}</code>
      </p>
      <p className="page-lotteries__muted">
        Placeholder — contenu détaillé à ajouter (lecture Supabase, etc.).
      </p>
    </section>
  );
}
