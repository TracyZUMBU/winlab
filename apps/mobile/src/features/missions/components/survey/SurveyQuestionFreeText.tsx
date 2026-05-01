import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/src/theme";

type Props = {
  questionIndex: number;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

const BADGE_SIZE = 28;

export function SurveyQuestionFreeText({
  questionIndex,
  label,
  value,
  onChangeText,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{questionIndex}</Text>
        </View>
        <Text style={styles.questionLabel}>{label}</Text>
      </View>

      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.textInput}
          placeholder={t("missions.detail.survey.textAnswerPlaceholder")}
          placeholderTextColor={theme.colors.textGrayLight}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.screenHorizontal,
    gap: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: theme.colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  questionLabel: {
    flex: 1,
    ...theme.typography.cardTitle,
    color: theme.colors.text,
    lineHeight: 22,
  },
  inputShell: {
    position: "relative",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    minHeight: 140,
    paddingBottom: theme.spacing.lg,
  },
  textInput: {
    minHeight: 120,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  optionalBadge: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: theme.spacing.sm,
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.textGrayLight,
  },
});
