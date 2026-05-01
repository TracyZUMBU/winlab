import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { theme } from "@/src/theme";
import type { MissionSurveyAnswerStep } from "../types";
import type { SurveyPendingAnswer } from "../survey/useSurveyMissionForm";
import type { SurveyQuestion } from "../survey/surveyDefinition";

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
        <View style={styles.surveyQuestionCard}>
          <Text style={styles.surveyQuestionCount}>
            {t("missions.detail.survey.questionCount", {
              count: answers.length + 1,
            })}
          </Text>
          <Text style={styles.surveyQuestionLabel}>{currentQuestion.label}</Text>

          {currentQuestion.type === "text" ? (
            <TextInput
              value={pendingAnswer.type === "text" ? pendingAnswer.value : ""}
              onChangeText={(value) => setPendingAnswer({ type: "text", value })}
              style={styles.surveyTextInput}
              placeholder={t("missions.detail.survey.textPlaceholder")}
              placeholderTextColor={theme.colors.textMutedAccent}
              multiline
            />
          ) : null}

          {currentQuestion.type === "single_choice"
            ? currentQuestion.options.map((option) => {
                const selected =
                  pendingAnswer.type === "single_choice" &&
                  pendingAnswer.value === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={styles.surveyOptionRow}
                    onPress={() =>
                      setPendingAnswer({ type: "single_choice", value: option.id })
                    }
                  >
                    <MaterialIcons
                      name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20}
                      color={theme.colors.accentSolid}
                    />
                    <Text style={styles.surveyOptionLabel}>{option.label}</Text>
                  </Pressable>
                );
              })
            : null}

          {currentQuestion.type === "multi_choice"
            ? currentQuestion.options.map((option) => {
                const selectedIds =
                  pendingAnswer.type === "multi_choice" ? pendingAnswer.value : [];
                const isSelected = selectedIds.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={styles.surveyOptionRow}
                    onPress={() =>
                      setPendingAnswer({
                        type: "multi_choice",
                        value: isSelected
                          ? selectedIds.filter((id) => id !== option.id)
                          : [...selectedIds, option.id],
                      })
                    }
                  >
                    <MaterialIcons
                      name={isSelected ? "check-box" : "check-box-outline-blank"}
                      size={20}
                      color={theme.colors.accentSolid}
                    />
                    <Text style={styles.surveyOptionLabel}>{option.label}</Text>
                  </Pressable>
                );
              })
            : null}
        </View>
      ) : (
        <View style={styles.surveyQuestionCard}>
          <Text style={styles.surveyCompleteText}>
            {t("missions.detail.survey.readyToSubmit", { count: answers.length })}
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
  surveyQuestionCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  surveyQuestionCount: {
    ...theme.typography.caption,
    color: theme.colors.textMutedAccent,
  },
  surveyQuestionLabel: {
    ...theme.typography.cardTitle,
    color: theme.colors.text,
  },
  surveyTextInput: {
    minHeight: 92,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    textAlignVertical: "top",
  },
  surveyOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  surveyOptionLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  surveyCompleteText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
