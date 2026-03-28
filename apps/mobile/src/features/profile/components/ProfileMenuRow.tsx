import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export type ProfileMenuRowProps = {
  icon: MaterialIconName;
  /** Maquette: accent wash icon tile vs neutral soft tile (support / legal). */
  iconVariant: "accent" | "neutral";
  title: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  accessibilityLabel?: string;
};

export function ProfileMenuRow({
  icon,
  iconVariant,
  title,
  subtitle,
  onPress,
  showDivider,
  accessibilityLabel,
}: ProfileMenuRowProps) {
  const iconTileStyle =
    iconVariant === "accent" ? styles.iconTileAccent : styles.iconTileNeutral;
  const iconColor =
    iconVariant === "accent"
      ? theme.colors.accentSolid
      : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.row,
        subtitle ? styles.rowTall : null,
        showDivider && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconTile, iconTileStyle]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>
      {subtitle ? (
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : (
        <Text style={[styles.title, styles.titleFlex]}>{title}</Text>
      )}
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={theme.colors.textMutedAccent}
      />
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
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: theme.colors.textMutedAccent,
  },
});
