import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function DailyLoginMissionDetail({
  mission,
  survey: _survey,
  video: _video,
  externalAction: _externalAction,
}: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
