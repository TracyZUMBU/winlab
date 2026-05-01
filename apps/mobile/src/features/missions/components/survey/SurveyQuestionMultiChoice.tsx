import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";
import type { SurveyOption } from "../../survey/surveyDefinition";

type Props = {
  questionIndex: number;
  label: string;
  options: SurveyOption[];
  selectedIds: string[];
  onToggleOption: (optionId: string) => void;
};

const BADGE_SIZE = 28;
const CHECK_CIRCLE = 24;

export function SurveyQuestionMultiChoice({
  questionIndex,
  label,
  options,
  selectedIds,
  onToggleOption,
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
          const selected = selectedIds.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.optionPill,
                selected
                  ? styles.optionPillSelected
                  : styles.optionPillUnselected,
                pressed && styles.optionPressed,
              ]}
              onPress={() => onToggleOption(option.id)}
            >
              <View style={styles.leadingControl}>
                {selected ? (
                  <View style={styles.checkCircle}>
                    <MaterialIcons
                      name="check"
                      size={16}
                      color={theme.colors.surface}
                    />
                  </View>
                ) : (
                  <View style={styles.emptyCircle} />
                )}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
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
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    minHeight: 48,
    gap: theme.spacing.sm,
  },
  optionPillUnselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  optionPillSelected: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 0,
  },
  optionPressed: {
    opacity: 0.92,
  },
  leadingControl: {
    width: CHECK_CIRCLE,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: CHECK_CIRCLE,
    height: CHECK_CIRCLE,
    borderRadius: CHECK_CIRCLE / 2,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    width: CHECK_CIRCLE,
    height: CHECK_CIRCLE,
    borderRadius: CHECK_CIRCLE / 2,
    borderWidth: 2,
    borderColor: theme.colors.textGrayLight,
    backgroundColor: theme.colors.surface,
  },
  optionLabel: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
