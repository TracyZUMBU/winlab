import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import { SurveyMissionSection } from "../../components/SurveyMissionSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function SurveyMissionDetail({
  mission,
  survey,
  video: _video,
  externalAction: _externalAction,
}: MissionTypeDetailRendererProps) {
  if (!survey) return null;

  return (
    <>
      <CommonMissionDetailSection mission={mission} />
      <SurveyMissionSection
        hasValidSurvey={survey.hasValidSurvey}
        answers={survey.answers}
        currentQuestion={survey.currentQuestion}
        pendingAnswer={survey.pendingAnswer}
        setPendingAnswer={survey.setPendingAnswer}
      />
    </>
  );
}
