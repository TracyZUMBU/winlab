import { StyleSheet, TouchableOpacity, View } from "react-native";

import { theme } from "@/src/theme";

type PaginationDotsProps = {
  total: number;
  activeIndex: number;
  onPress: (index: number) => void;
};

export function PaginationDots({
  total,
  activeIndex,
  onPress,
}: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <TouchableOpacity onPress={() => onPress?.(index)} key={index}>
            <View
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 8;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotInactive: {
    backgroundColor: "rgba(15, 23, 42, 0.12)",
  },
  dotActive: {
    width: DOT_SIZE * 2.4,
    backgroundColor: theme.colors.accentSolid,
  },
});
