import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function DailyLoginMissionDetail({ mission }: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
