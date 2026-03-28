import { StyleSheet, Text, type TextStyle } from "react-native";

import { theme } from "@/src/theme";

type ScreenSectionOverlineProps = {
  label: string;
  style?: TextStyle;
};

export function ScreenSectionOverline({ label, style }: ScreenSectionOverlineProps) {
  return (
    <Text style={[styles.text, style]} accessibilityRole="header">
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...theme.typography.overline,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: theme.colors.textMutedAccent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
});
