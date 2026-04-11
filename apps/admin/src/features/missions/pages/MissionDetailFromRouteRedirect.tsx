import { Navigate, useParams } from "react-router-dom";

/** URL `/missions/:id` → liste avec panneau (`?detail=`). */
export function MissionDetailFromRouteRedirect() {
  const { missionId } = useParams<{ missionId: string }>();
  const id = missionId?.trim() ?? "";
  if (!id) {
    return <Navigate to="/missions" replace />;
  }
  return <Navigate to={`/missions?detail=${encodeURIComponent(id)}`} replace />;
}
