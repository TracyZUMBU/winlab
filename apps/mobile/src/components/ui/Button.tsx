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

type ButtonVariant = "primary" | "ghost";

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  leftIcon?: ReactNode;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled,
  leftIcon,
}: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text
        style={[
          styles.textBase,
          isPrimary ? styles.textPrimary : styles.textGhost,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: {
    backgroundColor: theme.colors.accentSolid,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: 16,
    fontWeight: "600",
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textGhost: {
    color: theme.colors.text,
  },
});
