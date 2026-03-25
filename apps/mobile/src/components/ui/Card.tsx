import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/src/theme";

export type CardVariant = "elevated" | "outlined";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
};

export function Card({
  children,
  style,
  variant = "elevated",
}: CardProps) {
  return (
    <View style={[variant === "elevated" ? styles.elevated : styles.outlined, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  elevated: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
});
