import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";
import { AppHeaderTitleAlign } from "./AppHeader";

export type AppHeaderFullProps = {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  /** Bottom hairline (e.g. under sticky header). Default true. */
  showBottomBorder?: boolean;
  /** Dashboard style: title flush start + trailing slot (default center). */
  titleAlign?: AppHeaderTitleAlign;
};

export function AppHeaderFull({
  title,
  leftSlot,
  rightSlot,
  showBottomBorder = true,
  titleAlign = "center",
}: AppHeaderFullProps) {
  if (titleAlign === "start") {
    return (
      <View style={[styles.rootStart, showBottomBorder && styles.rootBordered]}>
        {leftSlot ? <View style={styles.startLeft}>{leftSlot}</View> : null}
        <Text style={styles.titleStart} numberOfLines={1}>
          {title}
        </Text>
        {rightSlot ? <View style={styles.startRight}>{rightSlot}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, showBottomBorder && styles.rootBordered]}>
      <View style={styles.side}>
        {leftSlot ?? <View style={styles.sideSpacer} />}
      </View>
      <Text style={styles.titleCenter} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>
        {rightSlot ?? <View style={styles.sideSpacer} />}
      </View>
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
  },
  rootStart: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.headerContentMinHeight,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
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
  titleCenter: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.text,
    ...theme.typography.screenTitle,
  },
  startLeft: {
    marginRight: theme.spacing.xs,
  },
  titleStart: {
    flex: 1,
    minWidth: 0,
    textAlign: "left",
    color: theme.colors.text,
    ...theme.typography.screenTitle,
  },
  startRight: {
    flexShrink: 0,
  },
});
