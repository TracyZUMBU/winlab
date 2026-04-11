import { Link, useParams } from "react-router-dom";

import { MissionDetailContent } from "../components/MissionDetailContent";
import { useMissionAdminDetail } from "../hooks/useMissionAdminDetail";

/** Détail mission en page pleine (RPC `admin_get_mission_detail`). */
export function MissionDetailPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const state = useMissionAdminDetail(missionId);

  return (
    <section
      className="page-mission-detail"
      aria-labelledby="mission-detail-heading"
    >
      <p className="page-mission-detail__back">
        <Link to="/missions">← Retour aux missions</Link>
      </p>

      <MissionDetailContent state={state} headingId="mission-detail-heading" />
    </section>
  );
}
