import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export type ProfileMenuRowProps = {
  icon: MaterialIconName;
  /** Accent / neutral list rows, or destructive (e.g. delete account). */
  iconVariant: "accent" | "neutral" | "destructive";
  title: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function ProfileMenuRow({
  icon,
  iconVariant,
  title,
  subtitle,
  onPress,
  showDivider,
  accessibilityLabel,
  disabled,
}: ProfileMenuRowProps) {
  const iconTileStyle =
    iconVariant === "accent"
      ? styles.iconTileAccent
      : iconVariant === "neutral"
        ? styles.iconTileNeutral
        : styles.iconTileDestructive;
  const iconColor =
    iconVariant === "accent"
      ? theme.colors.accentSolid
      : iconVariant === "neutral"
        ? theme.colors.text
        : theme.colors.dangerSolid;
  const titleStyle =
    iconVariant === "destructive" ? styles.titleDestructive : styles.title;
  const subtitleStyle =
    iconVariant === "destructive"
      ? styles.subtitleDestructive
      : styles.subtitle;
  const chevronColor =
    iconVariant === "destructive"
      ? theme.colors.dangerSolid
      : theme.colors.textMutedAccent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.row,
        subtitle ? styles.rowTall : null,
        showDivider && styles.rowDivider,
        disabled && styles.rowDisabled,
        !disabled &&
          pressed &&
          (iconVariant === "destructive"
            ? styles.rowPressedDestructive
            : styles.rowPressed),
      ]}
    >
      <View style={[styles.iconTile, iconTileStyle]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>
      {subtitle ? (
        <View style={styles.textBlock}>
          <Text style={titleStyle}>{title}</Text>
          <Text style={subtitleStyle}>{subtitle}</Text>
        </View>
      ) : (
        <Text style={[titleStyle, styles.titleFlex]}>{title}</Text>
      )}
      <MaterialIcons name="chevron-right" size={22} color={chevronColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: 60,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowTall: {
    minHeight: 72,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.background,
  },
  rowPressed: {
    backgroundColor: theme.colors.accentWash,
  },
  rowPressedDestructive: {
    backgroundColor: theme.colors.dangerMuted,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTileAccent: {
    backgroundColor: theme.colors.accentWash,
  },
  iconTileNeutral: {
    backgroundColor: theme.colors.surfaceSoft,
  },
  iconTileDestructive: {
    backgroundColor: theme.colors.dangerMuted,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  titleDestructive: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.dangerSolid,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: theme.colors.textMutedAccent,
  },
  subtitleDestructive: {
    fontSize: 14,
    fontWeight: "400",
    color: theme.colors.textMuted,
  },
});
