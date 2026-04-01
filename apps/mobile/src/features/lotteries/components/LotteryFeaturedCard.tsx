import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import { formatFeaturedTime, getTimeRemaining } from "../utils/lotteryTime";
const ONE_HOUR_IN_MS = 1000 * 60 * 60;
export type LotteryFeaturedCardProps = {
  lottery: AvailableLotteryUi;
  onPress: (lotteryId: string) => void;
};

export function LotteryFeaturedCard({
  lottery,
  onPress,
}: LotteryFeaturedCardProps) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: ONE_HOUR_IN_MS });
  const remaining = getTimeRemaining(lottery.ends_at, nowMs);
  const featuredTime = formatFeaturedTime(t, remaining);

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
        <View style={styles.drawChip}>
          <Text style={styles.drawChipText}>
            {t("lotteries.list.drawIn", { time: featuredTime })}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="clip">
            {lottery.title}
          </Text>
          {lottery.short_description ? (
            <Text
              style={styles.subtitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {lottery.short_description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="group"
                size={18}
                color={theme.colors.textMuted}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {lottery.participantsLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaOverline}>{t("lotteries.list.enter")}</Text>
          <View style={styles.ctaRow}>
            <Text style={styles.ctaValue}>{lottery.ticket_cost}</Text>
            <MaterialIcons
              name="token"
              size={14}
              color={theme.colors.onAccent}
            />
          </View>
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  mediaWrap: {
    height: 192,
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
  drawChip: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  drawChipText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  body: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.cardBody,
  },
  metaRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  cta: {
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaOverline: {
    color: theme.colors.onAccent,
    ...theme.typography.overline,
    opacity: 0.8,
    marginBottom: 2,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaValue: {
    color: theme.colors.onAccent,
    fontSize: 14,
    fontWeight: "900",
  },
});
