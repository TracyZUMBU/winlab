import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";

import type { HomeDashboardParticipation } from "../types/homeDashboard";

export type HomeParticipationRowProps = {
  participation: HomeDashboardParticipation;
  drawDateLabel: string;
  ticketsLabel: string;
  chanceLabel: string;
  onPress: (lotteryId: string) => void;
};

export function HomeParticipationRow({
  participation,
  drawDateLabel,
  ticketsLabel,
  chanceLabel,
  onPress,
}: HomeParticipationRowProps) {
  return (
    <Pressable
      onPress={() => onPress(participation.lottery_id)}
      accessibilityRole="button"
    >
      <Card variant="outlined" style={styles.card}>
        <View style={styles.thumb}>
          {participation.image_url ? (
            <Image
              source={{ uri: participation.image_url }}
              style={styles.thumbImg}
              contentFit="cover"
            />
          ) : (
            <View style={styles.thumbFallback}>
              <MaterialIcons
                name="card-giftcard"
                size={22}
                color={theme.colors.accentSolid}
              />
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {participation.title}
          </Text>
          <Text style={styles.meta}>{drawDateLabel}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.tickets}>{ticketsLabel}</Text>
          {/* <Text style={styles.chance}>{chanceLabel}</Text> */}
        </View>
      </Card>
    </Pressable>
  );
}

const THUMB = 48;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceSoft,
  },
  thumbImg: {
    width: THUMB,
    height: THUMB,
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentWash,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textGrayLight,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  tickets: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.accentSolid,
  },
  chance: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.textMutedAccent,
  },
});
