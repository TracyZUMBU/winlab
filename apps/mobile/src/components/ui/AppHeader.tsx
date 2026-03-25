import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

export type AppHeaderProps = {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  /** Bottom hairline (e.g. under sticky header). Default true. */
  showBottomBorder?: boolean;
};

export function AppHeader({
  title,
  leftSlot,
  rightSlot,
  showBottomBorder = true,
}: AppHeaderProps) {
  return (
    <View
      style={[styles.root, showBottomBorder && styles.rootBordered]}
    >
      <View style={styles.side}>{leftSlot ?? <View style={styles.sideSpacer} />}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{rightSlot ?? <View style={styles.sideSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.headerContentMinHeight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screenHorizontal,
  },
  rootBordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  side: {
    minWidth: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  sideSpacer: {
    width: theme.layout.minTouchTarget,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.text,
    ...theme.typography.screenTitle,
  },
});
