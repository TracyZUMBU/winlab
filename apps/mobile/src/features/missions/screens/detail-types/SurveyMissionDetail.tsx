import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import { SurveyMissionSection } from "../../components/SurveyMissionSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function SurveyMissionDetail({ mission, survey }: MissionTypeDetailRendererProps) {
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
