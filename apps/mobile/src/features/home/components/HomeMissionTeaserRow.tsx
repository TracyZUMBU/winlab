import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";

import type { HomeDashboardMissionPreview } from "../types/homeDashboard";
import { missionTypeToMaterialIconName } from "../utils/missionTypeIcon";

export type HomeMissionTeaserRowProps = {
  mission: HomeDashboardMissionPreview;
  subtitle: string;
  rewardLabel: string;
  onPress: (missionId: string) => void;
};

export function HomeMissionTeaserRow({
  mission,
  subtitle,
  rewardLabel,
  onPress,
}: HomeMissionTeaserRowProps) {
  const iconName = missionTypeToMaterialIconName(mission.mission_type);

  return (
    <Pressable onPress={() => onPress(mission.id)} accessibilityRole="button">
      <Card variant="outlined" style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name={iconName}
            size={26}
            color={theme.colors.accentSolid}
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {mission.title}
          </Text>
          {/* <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text> */}
        </View>
        <View style={styles.rewardPill}>
          <Text style={styles.rewardText}>{rewardLabel}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accentWash,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMutedAccent,
  },
  rewardPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentMuted,
    flexShrink: 0,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },
});
