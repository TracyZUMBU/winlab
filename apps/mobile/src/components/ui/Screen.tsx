import type { ReactNode } from "react";
import { StatusBar, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/theme";

export type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

export function Screen({
  children,
  style,
  // Default: avoid applying bottom safe-area under `Tabs` screens.
  // Individual screens can override when they need bottom padding.
  edges = ["top"],
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <StatusBar barStyle="dark-content" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
