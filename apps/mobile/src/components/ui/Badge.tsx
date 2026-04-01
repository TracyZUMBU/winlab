import type { ReactNode } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { theme } from "@/src/theme";

export type BadgeTone = "accent" | "success" | "warning" | "neutral";

type BadgeProps = {
  children: string | number;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.root, toneStyles[tone].container]}>
      <Text style={[styles.text, toneStyles[tone].text]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
    maxWidth: "100%",
  },
  text: {
    ...theme.typography.overline,
    textTransform: "uppercase",
  },
});

const toneStyles: Record<BadgeTone, { container: ViewStyle; text: TextStyle }> =
  {
    accent: {
      container: { backgroundColor: theme.colors.accentMuted },
      text: { color: theme.colors.accentSolid },
    },
    success: {
      container: { backgroundColor: theme.colors.semantic.successMuted },
      text: { color: theme.colors.text },
    },
    warning: {
      container: { backgroundColor: theme.colors.semantic.warningMuted },
      text: { color: theme.colors.text },
    },
    neutral: {
      container: { backgroundColor: theme.colors.semantic.neutralMuted },
      text: { color: theme.colors.textGrayLight },
    },
  };
