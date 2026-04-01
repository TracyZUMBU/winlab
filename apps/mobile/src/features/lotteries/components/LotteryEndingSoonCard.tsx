import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import { formatEndingSoonTime, getTimeRemaining } from "../utils/lotteryTime";

export type LotteryEndingSoonCardProps = {
  lottery: AvailableLotteryUi;
  onPress: (lotteryId: string) => void;
};

export function LotteryEndingSoonCard({
  lottery,
  onPress,
}: LotteryEndingSoonCardProps) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: 60_000 });
  const remaining = getTimeRemaining(lottery.ends_at, nowMs);
  const isEnded = "kind" in remaining && remaining.kind === "expired";
  const timeLabel = isEnded
    ? t("lotteries.list.ended")
    : formatEndingSoonTime(t, remaining);

  return (
    <Pressable
      style={styles.card}
      disabled={isEnded}
      onPress={() => onPress(lottery.id)}
      accessibilityRole="button"
      accessibilityState={{ disabled: isEnded }}
      accessibilityLabel={
        isEnded
          ? t("lotteries.list.a11y.endedLottery", { title: lottery.title })
          : t("lotteries.list.a11y.openLottery", { title: lottery.title })
      }
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
        <View
          style={[styles.timerBadge, isEnded && styles.timerBadgeEnded]}
        >
          <MaterialIcons
            name="timer"
            size={12}
            color={isEnded ? theme.colors.surface : theme.colors.onAccent}
          />
          <Text
            style={[styles.timerText, isEnded && styles.timerTextEnded]}
          >
            {timeLabel}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {lottery.title}
        </Text>

        <View style={styles.entriesRow}>
          <MaterialIcons
            name="groups"
            size={14}
            color={theme.colors.textMutedAccent}
          />
          <Text style={styles.entriesText} numberOfLines={1}>
            {lottery.participantsLabel}
          </Text>
        </View>

        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.ctaShell,
            styles.cta,
            isEnded && styles.ctaShellDimmed,
          ]}
        >
          <Text
            accessible={false}
            style={[styles.ctaLabelBase, styles.ctaText]}
          >
            {lottery.ticketCostLabel}
          </Text>
          <MaterialIcons
            name="token"
            size={16}
            color={theme.colors.onAccent}
            accessible={false}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  mediaWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 5,
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
  timerBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.dangerSolid,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  timerText: {
    color: theme.colors.onAccent,
    fontSize: 10,
    fontWeight: "800",
  },
  timerBadgeEnded: {
    backgroundColor: theme.colors.textMuted,
  },
  timerTextEnded: {
    color: theme.colors.surface,
  },
  body: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.cardTitle,
    lineHeight: 18,
    fontWeight: "600",
    fontSize: 14,
  },
  entriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entriesText: {
    color: theme.colors.textMutedAccent,
    fontSize: 11,
    fontWeight: "600",
  },
  /** Non-interactive replica of primary `Button` — whole card is the single `Pressable`. */
  ctaShell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: theme.colors.accentSolid,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaShellDimmed: {
    opacity: 0.5,
  },
  cta: {
    marginTop: "auto",
    borderRadius: theme.radius.xs,
    paddingVertical: theme.spacing.sm,
  },
  ctaLabelBase: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.onAccent,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
