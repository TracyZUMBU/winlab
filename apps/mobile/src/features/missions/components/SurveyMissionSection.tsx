import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { theme } from "@/src/theme";
import type { SurveyQuestion } from "../survey/surveyDefinition";
import type { SurveyPendingAnswer } from "../survey/useSurveyMissionForm";
import type { MissionSurveyAnswerStep } from "../types";
import { SurveyQuestionFreeText } from "./survey/SurveyQuestionFreeText";
import { SurveyQuestionMultiChoice } from "./survey/SurveyQuestionMultiChoice";
import { SurveyQuestionSingleChoice } from "./survey/SurveyQuestionSingleChoice";

type Props = {
  hasValidSurvey: boolean;
  answers: MissionSurveyAnswerStep[];
  currentQuestion: SurveyQuestion | null;
  pendingAnswer: SurveyPendingAnswer;
  setPendingAnswer: (value: SurveyPendingAnswer) => void;
};

export function SurveyMissionSection({
  hasValidSurvey,
  answers,
  currentQuestion,
  pendingAnswer,
  setPendingAnswer,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.surveySection}>
      <SectionHeader title={t("missions.detail.survey.title")} />
      {!hasValidSurvey ? (
        <Text style={styles.submitError}>
          {t("missions.submission.errors.SURVEY_CONFIG_INVALID")}
        </Text>
      ) : currentQuestion ? (
        <>
          {currentQuestion.type === "text" ? (
            <SurveyQuestionFreeText
              questionIndex={answers.length + 1}
              label={currentQuestion.label}
              value={pendingAnswer.type === "text" ? pendingAnswer.value : ""}
              onChangeText={(value) =>
                setPendingAnswer({ type: "text", value })
              }
            />
          ) : null}

          {currentQuestion.type === "single_choice" ? (
            <SurveyQuestionSingleChoice
              questionIndex={answers.length + 1}
              label={currentQuestion.label}
              options={currentQuestion.options}
              selectedOptionId={
                pendingAnswer.type === "single_choice"
                  ? pendingAnswer.value
                  : null
              }
              onSelectOption={(optionId) =>
                setPendingAnswer({ type: "single_choice", value: optionId })
              }
            />
          ) : null}

          {currentQuestion.type === "multi_choice" ? (
            <SurveyQuestionMultiChoice
              questionIndex={answers.length + 1}
              label={currentQuestion.label}
              options={currentQuestion.options}
              selectedIds={
                pendingAnswer.type === "multi_choice" ? pendingAnswer.value : []
              }
              onToggleOption={(optionId) => {
                const selectedIds =
                  pendingAnswer.type === "multi_choice"
                    ? pendingAnswer.value
                    : [];
                const isSelected = selectedIds.includes(optionId);
                setPendingAnswer({
                  type: "multi_choice",
                  value: isSelected
                    ? selectedIds.filter((id) => id !== optionId)
                    : [...selectedIds, optionId],
                });
              }}
            />
          ) : null}
        </>
      ) : (
        <View style={styles.surveyCompleteCard}>
          <Text style={styles.surveyCompleteText}>
            {t("missions.detail.survey.readyToSubmit")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  submitError: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text,
    textAlign: "center",
    paddingHorizontal: theme.spacing.md,
  },
  surveySection: {
    marginTop: theme.spacing.xl,
  },
  surveyCompleteCard: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.screenHorizontal,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  surveyCompleteText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
