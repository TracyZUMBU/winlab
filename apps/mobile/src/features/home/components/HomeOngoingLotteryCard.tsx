import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import type { HomeDashboardOngoingLottery } from "../types/homeDashboard";
import { formatHomeLotteryCountdown } from "../utils/formatHomeLotteryCountdown";

const CARD_WIDTH = 280;

export type HomeOngoingLotteryCardProps = {
  lottery: HomeDashboardOngoingLottery;
  onPress: (lotteryId: string) => void;
};

export function HomeOngoingLotteryCard({
  lottery,
  onPress,
}: HomeOngoingLotteryCardProps) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: 60_000 });
  const countdown = formatHomeLotteryCountdown(t, lottery.ends_at, nowMs);
  const showEndingSoonBadge = lottery.is_ending_soon;
  const countdownColor = showEndingSoonBadge
    ? theme.colors.dangerSolid
    : theme.colors.text;

  return (
    <Pressable
      style={styles.root}
      onPress={() => onPress(lottery.id)}
      accessibilityRole="button"
      accessibilityLabel={t("lotteries.list.a11y.openLottery", {
        title: lottery.title,
      })}
    >
      <View style={styles.mediaWrap}>
        {lottery.image_url ? (
          <Image
            source={{ uri: lottery.image_url }}
            style={styles.media}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.mediaPlaceholder} />
        )}
        {showEndingSoonBadge ? (
          <View style={styles.endingBadge}>
            <MaterialIcons
              name="timer"
              size={12}
              color={theme.colors.onAccent}
            />
            <Text style={styles.endingBadgeText}>
              {t("home.lottery.endingSoonBadge")}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {lottery.title}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.countdownCol}>
            <Text style={styles.countdownLabel}>
              {t("home.lottery.endsInLabel")}
            </Text>
            <Text style={[styles.countdownValue, { color: countdownColor }]}>
              {countdown}
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>
              {t("home.lottery.ctaParticipate")}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  mediaWrap: {
    position: "relative",
    height: 176,
    backgroundColor: theme.colors.surfaceSoft,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSoft,
  },
  endingBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.dangerSolid,
  },
  endingBadgeText: {
    color: theme.colors.onAccent,
    fontSize: 10,
    fontWeight: "800",
  },
  body: {
    padding: theme.spacing.md,

    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  countdownCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.textGrayLight,
  },
  countdownValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  cta: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accentSolid,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.onAccent,
  },
});
