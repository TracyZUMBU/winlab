import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import type { MarketplaceMasonryColumn } from "../utils/marketplaceMasonry";
import { marketplaceImageAspect } from "../utils/marketplaceMasonry";
import {
  formatEndingSoonTime,
  getTimeRemaining,
  lotteryEndsWithinOneDay,
} from "../utils/lotteryTime";

export type LotteryMarketplaceCardProps = {
  lottery: AvailableLotteryUi;
  onPress: (lotteryId: string) => void;
  column: MarketplaceMasonryColumn;
  indexInColumn: number;
};

export function LotteryMarketplaceCard({
  lottery,
  onPress,
  column,
  indexInColumn,
}: LotteryMarketplaceCardProps) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: 60_000 });
  const remaining = getTimeRemaining(lottery.ends_at, nowMs);
  const showEndBadge = lotteryEndsWithinOneDay(lottery.ends_at, nowMs);
  const countdownShort = formatEndingSoonTime(t, remaining);
  const aspect = marketplaceImageAspect(column, indexInColumn);

  const categoryLabel = (lottery.category ?? "")
    .replace(/-/g, " ")
    .trim()
    .toUpperCase();

  const badgeText =
    lottery.is_featured && lottery.category !== "gift-card"
      ? t("lotteries.catalog.card.badgeFeatured")
      : categoryLabel.length > 0
        ? categoryLabel
        : t("lotteries.catalog.card.badgeDefault");

  return (
    <Pressable
      style={styles.root}
      onPress={() => onPress(lottery.id)}
      accessibilityRole="button"
      accessibilityLabel={t("lotteries.list.a11y.openLottery", {
        title: lottery.title,
      })}
    >
      <View style={styles.mediaBlock}>
        <View style={[styles.mediaRatio, { aspectRatio: aspect }]}>
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
        </View>
        <View style={styles.categoryBadge} pointerEvents="none">
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {badgeText}
          </Text>
        </View>
        {showEndBadge ? (
          <View style={styles.endsBadge} pointerEvents="none">
            <Text style={styles.endsBadgeText} numberOfLines={1}>
              {t("lotteries.catalog.card.endsInCompact", {
                time: countdownShort,
              })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {lottery.title}
        </Text>

        {lottery.user_active_tickets_count > 0 ? (
          <View style={styles.myTicketsRow}>
            <MaterialIcons
              name="confirmation-number"
              size={14}
              color={theme.colors.textMutedAccent}
            />
            <Text style={styles.myTicketsText} numberOfLines={1}>
              {lottery.userTicketsLabel}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.cta,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            },
          ]}
        >
          <Text style={styles.ctaText}>
            {t("lotteries.catalog.card.worthTokens", {
              count: lottery.ticket_cost,
            })}
          </Text>
          <MaterialIcons name="token" size={16} color={theme.colors.onAccent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.borderAccentMuted,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: theme.spacing.md,
  },
  mediaBlock: {
    position: "relative",
    width: "100%",
  },
  mediaRatio: {
    width: "100%",
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
  categoryBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    maxWidth: "88%",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: theme.colors.text,
  },
  endsBadge: {
    position: "absolute",
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSolid,
  },
  endsBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.onAccent,
  },
  body: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  myTicketsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  myTicketsText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMutedAccent,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMutedAccent,
    flexShrink: 1,
  },
  cta: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: theme.colors.onAccent,
    fontSize: 13,
    fontWeight: "800",
  },
});
