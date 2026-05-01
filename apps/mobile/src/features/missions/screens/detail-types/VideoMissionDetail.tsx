import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function VideoMissionDetail({ mission }: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
