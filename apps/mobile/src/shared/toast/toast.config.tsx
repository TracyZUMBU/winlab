import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

import { WINLAB_TOAST_TYPES } from "./toast.types";

type ShellProps = ToastConfigParams<unknown> & {
  iconName: ComponentProps<typeof MaterialIcons>["name"];
  /** Solid color for the left accent stripe (not a translucent fill). */
  accentStripeColor: string;
  borderColor: string;
  titleColor: string;
  messageColor: string;
};

function WinlabToastShell({
  text1,
  text2,
  onPress,
  iconName,
  accentStripeColor,
  borderColor,
  titleColor,
  messageColor,
}: ShellProps) {
  const hasSecondary = Boolean(text2 && text2.trim().length > 0);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor,
          borderLeftColor: accentStripeColor,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name={iconName} size={22} color={titleColor} />
      </View>
      <View style={styles.textCol}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={hasSecondary ? 2 : 3}
        >
          {text1 ?? ""}
        </Text>
        {hasSecondary ? (
          <Text style={[styles.message, { color: messageColor }]} numberOfLines={4}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** Opaque surface so content behind never shows through (muted semantic colors are too transparent). */
  card: {
    minHeight: 56,
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  iconWrap: {
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: theme.spacing.xs / 2,
  },
  title: {
    ...theme.typography.cardTitle,
    fontSize: 15,
  },
  message: {
    ...theme.typography.cardBody,
    fontSize: 13,
    lineHeight: 18,
  },
});

export const winlabToastConfig: ToastConfig = {
  [WINLAB_TOAST_TYPES.success]: (props) => (
    <WinlabToastShell
      {...props}
      iconName="check-circle"
      accentStripeColor={theme.colors.success}
      borderColor="rgba(22, 163, 74, 0.28)"
      titleColor={theme.colors.success}
      messageColor={theme.colors.text}
    />
  ),
  [WINLAB_TOAST_TYPES.error]: (props) => (
    <WinlabToastShell
      {...props}
      iconName="error-outline"
      accentStripeColor={theme.colors.dangerSolid}
      borderColor="rgba(220, 38, 38, 0.28)"
      titleColor={theme.colors.dangerSolid}
      messageColor={theme.colors.text}
    />
  ),
  [WINLAB_TOAST_TYPES.info]: (props) => (
    <WinlabToastShell
      {...props}
      iconName="info-outline"
      accentStripeColor={theme.colors.accentSolid}
      borderColor={theme.colors.borderSubtle}
      titleColor={theme.colors.text}
      messageColor={theme.colors.textMuted}
    />
  ),
  [WINLAB_TOAST_TYPES.warning]: (props) => (
    <WinlabToastShell
      {...props}
      iconName="warning-amber"
      accentStripeColor="#D97706"
      borderColor="rgba(245, 158, 11, 0.35)"
      titleColor="#B45309"
      messageColor={theme.colors.text}
    />
  ),
};
