import { Link, useParams } from "react-router-dom";
import { LotteryDetailContent } from "../components/LotteryDetailContent";
import { useLotteryAdminDetail } from "../hooks/useLotteryAdminDetail";

/** Détail loterie en page pleine (RPC `admin_get_lottery_detail`). */
export function LotteryDetailPage() {
  const { lotteryId } = useParams<{ lotteryId: string }>();
  const state = useLotteryAdminDetail(lotteryId);

  return (
    <section className="page-lottery-detail" aria-labelledby="lottery-detail-heading">
      <p className="page-lottery-detail__back">
        <Link to="/lotteries">← Retour à la liste</Link>
      </p>

      <LotteryDetailContent
        state={state}
        headingId="lottery-detail-heading"
        hideTitleWhenOk={false}
      />
    </section>
  );
}
