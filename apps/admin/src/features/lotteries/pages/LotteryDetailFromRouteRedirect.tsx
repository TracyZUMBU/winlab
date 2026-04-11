import { Navigate, useParams } from "react-router-dom";

/** Ancienne URL `/lotteries/:id` → liste avec panneau (`?detail=`). */
export function LotteryDetailFromRouteRedirect() {
  const { lotteryId } = useParams<{ lotteryId: string }>();
  const id = lotteryId?.trim() ?? "";
  if (!id) {
    return <Navigate to="/lotteries" replace />;
  }
  return <Navigate to={`/lotteries?detail=${encodeURIComponent(id)}`} replace />;
}
