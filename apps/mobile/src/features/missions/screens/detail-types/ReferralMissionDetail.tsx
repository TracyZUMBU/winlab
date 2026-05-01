import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function ReferralMissionDetail({ mission }: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
