import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/theme";

export type SegmentedControlItem<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  style?: ViewStyle;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, style]}>
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onValueChange(item.value)}
            style={[styles.item, selected && styles.itemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.labelActive : styles.labelIdle,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    gap: 4,
  },
  item: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  labelActive: {
    color: theme.colors.text,
  },
  labelIdle: {
    color: theme.colors.textMuted,
  },
});
