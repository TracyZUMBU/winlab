import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { theme } from "@/src/theme";

type ListGroupProps = {
  children: ReactNode;
  style?: ViewStyle;
};

/** Grouped list surface: white card, light shadow, no default padding. */
export function ListGroup({ children, style }: ListGroupProps) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});
