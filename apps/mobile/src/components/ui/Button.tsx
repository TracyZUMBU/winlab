import { ReactNode } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import { theme } from "@/src/theme";

type ButtonVariant = "primary" | "soft" | "ghost";

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Full-width row (e.g. CTA inside a card). */
  fullWidth?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        variant === "primary" && styles.primary,
        variant === "soft" && styles.soft,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text
        style={[
          styles.textBase,
          variant === "primary" && styles.textOnAccent,
          variant === "soft" && styles.textDefault,
          variant === "ghost" && styles.textDefault,
          textStyle,
        ]}
      >
        {title}
      </Text>
      {rightIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.sm,
  },
  fullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  primary: {
    backgroundColor: theme.colors.accentSolid,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    backgroundColor: theme.colors.accentMuted,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: 16,
    fontWeight: "700",
  },
  textOnAccent: {
    color: theme.colors.onAccent,
  },
  textDefault: {
    color: theme.colors.text,
  },
});
