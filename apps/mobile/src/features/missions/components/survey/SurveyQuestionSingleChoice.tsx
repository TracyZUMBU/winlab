import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";
import type { SurveyOption } from "../../survey/surveyDefinition";

type Props = {
  questionIndex: number;
  label: string;
  options: SurveyOption[];
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
};

const BADGE_SIZE = 28;
const RADIO_OUTER = 22;
const RADIO_INNER = 10;

export function SurveyQuestionSingleChoice({
  questionIndex,
  label,
  options,
  selectedOptionId,
  onSelectOption,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{questionIndex}</Text>
        </View>
        <Text style={styles.questionLabel}>{label}</Text>
      </View>

      <View style={styles.options}>
        {options.map((option) => {
          const selected = selectedOptionId === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.optionPill,
                selected
                  ? styles.optionPillSelected
                  : styles.optionPillUnselected,
                pressed && styles.optionPressed,
              ]}
              onPress={() => onSelectOption(option.id)}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
              <View
                style={[
                  styles.radioOuter,
                  selected ? styles.radioOuterSelected : styles.radioOuterIdle,
                ]}
              >
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
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
  options: {
    gap: 10,
  },
  optionPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    minHeight: 48,
  },
  optionPillUnselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  optionPillSelected: {
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionLabel: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingRight: theme.spacing.sm,
  },
  radioOuter: {
    width: RADIO_OUTER,
    height: RADIO_OUTER,
    borderRadius: RADIO_OUTER / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterIdle: {
    borderWidth: 2,
    borderColor: theme.colors.textGrayLight,
    backgroundColor: theme.colors.surface,
  },
  radioOuterSelected: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  radioInner: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: RADIO_INNER / 2,
    backgroundColor: theme.colors.accent,
  },
});
