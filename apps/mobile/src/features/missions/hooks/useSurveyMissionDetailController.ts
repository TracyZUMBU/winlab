import type { TFunction, i18n as I18nInstance } from "i18next";

import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { logger } from "@/src/lib/logger";
import { showSuccessToast } from "@/src/shared/toast";
import type {
  SubmitMissionCompletionParams,
  SubmitMissionCompletionResult,
} from "../services/missionService";
import type { SurveyDefinition, SurveyQuestion } from "../survey/surveyDefinition";
import type { CommitSurveyAnswerResult } from "../survey/useSurveyMissionForm";
import type { MissionSurveyAnswerStep, MissionSurveyProofPayload } from "../types";
import type { MissionDetailTypeController } from "../screens/detail-types/types";

type Params = {
  missionId: string | undefined;
  isPending: boolean;
  surveyDefinition: SurveyDefinition | null;
  surveyAnswers: MissionSurveyAnswerStep[];
  currentSurveyQuestion: SurveyQuestion | null;
  isSurveyCompleted: boolean;
  commitCurrentAnswer: () => CommitSurveyAnswerResult;
  backSurveyQuestion: () => void;
  mutateAsync: (
    payload: SubmitMissionCompletionParams,
  ) => Promise<SubmitMissionCompletionResult>;
  refetch: () => Promise<unknown>;
  setSubmitError: (value: string | null) => void;
  t: TFunction;
  i18n: I18nInstance;
  router: {
    replace: (href: "/missions") => void;
  };
};

export function useSurveyMissionDetailController({
  missionId,
  isPending,
  surveyDefinition,
  surveyAnswers,
  currentSurveyQuestion,
  isSurveyCompleted,
  commitCurrentAnswer,
  backSurveyQuestion,
  mutateAsync,
  refetch,
  setSubmitError,
  t,
  i18n,
  router,
}: Params): MissionDetailTypeController {
  const submitSurvey = async () => {
    if (!missionId || !isSurveyCompleted) return;
    setSubmitError(null);

    try {
      const proofData: MissionSurveyProofPayload = {
        surveyId: "",
        answers: surveyAnswers,
      };
      const result = await mutateAsync({ missionId, proofData });

      if (result.success) {
        showSuccessToast({ title: t("missions.screen.submitMission") });
        await refetch();
        router.replace("/missions");
        return;
      }

      if (result.kind === "business") {
        setSubmitError(
          getI18nMessageForCode({
            t,
            i18n,
            baseKey: "missions.submission.errors",
            code: result.errorCode,
            fallbackKey: "missions.submission.errors.generic",
          }),
        );
        return;
      }
      setSubmitError(t("missions.submission.errors.generic"));
    } catch (error) {
      logger.error("Survey mission submit failed", error);
      setSubmitError(t("missions.submission.errors.generic"));
    }
  };

  const onPress = async () => {
    if (!surveyDefinition) {
      setSubmitError(t("missions.submission.errors.SURVEY_CONFIG_INVALID"));
      return;
    }

    if (currentSurveyQuestion) {
      const result = commitCurrentAnswer();
      if (result.ok) {
        setSubmitError(null);
        return;
      }
      if (result.reason === "missing_answer") {
        setSubmitError(t("missions.detail.survey.errors.missingAnswer"));
        return;
      }
      return;
    }

    await submitSurvey();
  };

  const title = isPending
    ? t("missions.detail.cta.launchPending")
    : currentSurveyQuestion
      ? t("missions.detail.survey.next")
      : isSurveyCompleted
        ? t("missions.detail.survey.submit")
        : t("missions.detail.cta.launch");

  return {
    primary: {
      title,
      iconName: currentSurveyQuestion ? "arrow-forward" : "play-arrow",
      disabled: isPending || !surveyDefinition,
      onPress,
    },
    secondary:
      surveyAnswers.length > 0
        ? {
            title: t("missions.detail.survey.previous"),
            disabled: isPending,
            onPress: backSurveyQuestion,
          }
        : null,
  };
}
