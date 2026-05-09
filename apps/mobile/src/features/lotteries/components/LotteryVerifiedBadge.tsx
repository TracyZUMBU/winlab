import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/theme";

type LotteryVerifiedBadgeProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function LotteryVerifiedBadge({
  label,
  style,
}: LotteryVerifiedBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <MaterialIcons
        name="verified"
        size={16}
        color={theme.colors.accentSolid}
      />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.text,
  },
});

