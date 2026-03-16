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
  edges = ["top", "bottom"],
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
