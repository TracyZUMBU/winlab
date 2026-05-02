import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function FollowMissionDetail({
  mission,
  survey: _survey,
  video: _video,
  externalAction: _externalAction,
}: MissionTypeDetailRendererProps) {
  return <CommonMissionDetailSection mission={mission} />;
}
