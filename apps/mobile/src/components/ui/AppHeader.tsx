import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

export type AppHeaderTitleAlign = "center" | "start";

export type AppHeaderProps = {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  /** Bottom hairline (e.g. under sticky header). Default true. */
  showBottomBorder?: boolean;
  /** Dashboard style: title flush start + trailing slot (default center). */
  titleAlign?: AppHeaderTitleAlign;
};

export function AppHeader({
  title,
  leftSlot,
  rightSlot,
  showBottomBorder = true,
  titleAlign = "center",
}: AppHeaderProps) {
  if (titleAlign === "start") {
    return (
      <View style={[styles.shell, showBottomBorder && styles.shellBordered]}>
        <View style={styles.contentStart}>
          {leftSlot ? <View style={styles.startLeft}>{leftSlot}</View> : null}
          <Text style={styles.titleStart} numberOfLines={1}>
            {title}
          </Text>
          {rightSlot ? (
            <View style={styles.startRight}>{rightSlot}</View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shell, showBottomBorder && styles.shellBordered]}>
      <View style={styles.contentCenter}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.backgroundHeader,
  },
  shellBordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.backgroundHeader,
  },
  contentCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.headerContentMinHeight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screenHorizontal,
  },
  contentStart: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.headerContentMinHeight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screenHorizontal,
    gap: theme.spacing.sm,
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
    minWidth: 0,
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
