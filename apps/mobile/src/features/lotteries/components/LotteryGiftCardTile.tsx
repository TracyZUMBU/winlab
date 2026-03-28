import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import { formatGiftCardTime, getTimeRemaining } from "../utils/lotteryTime";

export type LotteryGiftCardTileProps = {
  lottery: AvailableLotteryUi;
  onPress: (lotteryId: string) => void;
  variant?: "warm" | "fresh";
};
const ONE_HOUR_IN_MS = 1000 * 60 * 60;
export function LotteryGiftCardTile({
  lottery,
  onPress,
  variant = "warm",
}: LotteryGiftCardTileProps) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: ONE_HOUR_IN_MS });
  const remaining = getTimeRemaining(lottery.ends_at, nowMs);
  const nextDrawTime = formatGiftCardTime(t, remaining);

  const iconName: React.ComponentProps<typeof MaterialIcons>["name"] =
    variant === "fresh" ? "local-cafe" : "card-giftcard";

  const tileVariant =
    variant === "fresh" ? giftCardVariants.fresh : giftCardVariants.warm;

  return (
    <Pressable
      style={styles.root}
      onPress={() => onPress(lottery.id)}
      accessibilityRole="button"
      accessibilityLabel={t("lotteries.list.a11y.openLottery", {
        title: lottery.title,
      })}
    >
      <View
        style={[
          styles.media,
          { backgroundColor: tileVariant.mediaBackgroundColor },
        ]}
      >
        <MaterialIcons
          name={iconName}
          size={34}
          color={tileVariant.iconColor}
        />
      </View>

      <View
        style={{
          flex: 1,
          gap: theme.spacing.sm,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={styles.title} numberOfLines={2}>
          {lottery.title}
        </Text>

        <Text style={styles.subtitle} numberOfLines={1}>
          {t("lotteries.list.nextDraw", { time: nextDrawTime })}
        </Text>

        <Button
          title={t("lotteries.list.tokensCta", { count: lottery.ticket_cost })}
          variant="soft"
          fullWidth
          style={styles.cta}
          textStyle={styles.ctaText}
          onPress={() => onPress(lottery.id)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.sm,
  },
  media: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.xs,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "400",
  },
  cta: {
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.xs + 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

const giftCardVariants = {
  warm: {
    mediaBackgroundColor: theme.colors.semantic.warningMuted,
    iconColor: theme.colors.text,
  },
  fresh: {
    mediaBackgroundColor: theme.colors.semantic.successMuted,
    iconColor: theme.colors.text,
  },
} as const;
