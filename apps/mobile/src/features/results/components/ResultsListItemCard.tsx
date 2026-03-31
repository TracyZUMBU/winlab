import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/src/components/ui/Badge";
import { theme } from "@/src/theme";

import type { ParticipatedDrawnLotteryUi } from "../hooks/useParticipatedDrawnLotteriesQuery";

export type ResultsListItemCardProps = {
  item: ParticipatedDrawnLotteryUi;
  onPress: (lotteryId: string) => void;
};

export function ResultsListItemCard({
  item,
  onPress,
}: ResultsListItemCardProps) {
  const { t } = useTranslation();

  const isUpcoming = useMemo(() => {
    const d = new Date(item.draw_at);
    if (!Number.isFinite(d.getTime())) return false;
    return d.getTime() > Date.now();
  }, [item.draw_at]);

  const statusLabel = isUpcoming
    ? t("results.userStatus.upcoming")
    : item.userResultStatusLabel;

  const badgeTone = isUpcoming
    ? "warning"
    : item.userResultStatus === "won"
      ? "success"
      : "neutral";

  const thumbnailUri = item.image_url ?? item.brand?.logo_url ?? null;

  return (
    <Pressable
      style={styles.root}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.row}>
        <View style={styles.leftThumb}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
        </View>

        <View style={styles.main}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t("results.list.drawDate", { date: item.drawAtLabel })}
          </Text>
        </View>

        <View style={styles.right}>
          <View style={styles.badgeWrap} pointerEvents="none">
            <Badge tone={badgeTone}>{statusLabel}</Badge>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={theme.colors.textGrayLight}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  leftThumb: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surfaceSoft,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  right: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.colors.textGrayLight,
    fontSize: 12,
    fontWeight: "400",
  },
  badgeWrap: {
    maxWidth: 160,
  },
  chevron: {
    alignSelf: "flex-end",
  },
});
