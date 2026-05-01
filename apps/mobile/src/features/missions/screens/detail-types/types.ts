import type { ComponentType } from "react";

import type { MissionRow } from "../../services/getMissionById";
import type { MissionSurveyAnswerStep } from "../../types";
import type { SurveyQuestion } from "../../survey/surveyDefinition";
import type { SurveyPendingAnswer } from "../../survey/useSurveyMissionForm";

export type SurveyDetailRendererProps = {
  hasValidSurvey: boolean;
  answers: MissionSurveyAnswerStep[];
  currentQuestion: SurveyQuestion | null;
  pendingAnswer: SurveyPendingAnswer;
  setPendingAnswer: (value: SurveyPendingAnswer) => void;
};

export type MissionTypeDetailRendererProps = {
  mission: MissionRow;
  survey: SurveyDetailRendererProps | null;
};

export type MissionTypeRendererPropsFactoryArgs = {
  mission: MissionRow;
  survey: SurveyDetailRendererProps;
};

export type MissionTypeDetailRenderer = ComponentType<MissionTypeDetailRendererProps>;

export type MissionDetailPrimaryAction = {
  title: string;
  iconName: "play-arrow" | "arrow-forward";
  disabled: boolean;
  onPress: () => Promise<void>;
};

export type MissionDetailSecondaryAction = {
  title: string;
  disabled?: boolean;
  onPress: () => void;
};

export type MissionDetailTypeController = {
  primary: MissionDetailPrimaryAction;
  secondary: MissionDetailSecondaryAction | null;
};
