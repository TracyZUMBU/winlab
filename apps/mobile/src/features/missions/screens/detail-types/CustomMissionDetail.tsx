import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function CustomMissionDetail({ mission }: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
