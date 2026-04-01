import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Image } from "expo-image";

import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ListGroup } from "@/src/components/ui/ListGroup";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { useLotteryResultDetailQuery } from "../hooks/useLotteryResultDetailQuery";

export function ResultDetailScreen() {
  const { t } = useTranslation();
  const { lotteryId } = useLocalSearchParams<{ lotteryId: string }>();
  const { data, isLoading, isError, isFetched, refetch } =
    useLotteryResultDetailQuery(lotteryId);

  if (!lotteryId) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centeredBlock}>
          <Text style={styles.helper}>{t("results.detail.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("results.detail.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centeredBlock}>
          <Text style={styles.errorText}>{t("results.screen.error")}</Text>
          <Text style={styles.helper}>{userFacingQueryLoadHint(t)}</Text>
          <View style={styles.retryWrap}>
            <Button title={t("common.retry")} onPress={() => void refetch()} />
          </View>
        </View>
      </Screen>
    );
  }

  if (isFetched && data === null) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centeredBlock}>
          <Text style={styles.helper}>{t("results.detail.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  if (!data) {
    return null;
  }

  const brandName = data.lottery.brand?.name?.trim() ?? "";
  const badgeTone =
    data.userResultStatus === "won"
      ? "success"
      : data.userTicketsCount > 0
        ? "neutral"
        : "warning";

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t("results.detail.lotterySection")} />
        <Card style={styles.lotteryCard} variant="outlined">
          {data.lottery.image_url ? (
            <View style={styles.lotteryMedia}>
              <Image
                source={{ uri: data.lottery.image_url }}
                style={styles.lotteryImage}
                contentFit="cover"
                transition={150}
              />
            </View>
          ) : null}

          <View style={styles.lotteryBody}>
            <Text style={styles.lotteryTitle} numberOfLines={2}>
              {data.lottery.title}
            </Text>
            {brandName ? (
              <Text style={styles.metaMuted} numberOfLines={1}>
                {brandName}
              </Text>
            ) : null}
            <Text style={styles.metaMuted} numberOfLines={1}>
              {t("results.detail.drawDate", { date: data.lottery.drawAtLabel })}
            </Text>
          </View>
        </Card>

        <SectionHeader title={t("results.detail.userSection")} />
        <Card variant="outlined">
          <View style={styles.userHeaderRow}>
            <Text style={styles.userTitle}>
              {t("results.detail.yourStatus")}
            </Text>
            <Badge tone={badgeTone}>{data.userResultStatusLabel}</Badge>
          </View>

          <View style={styles.userMetaGrid}>
            <View style={styles.userMetaRow}>
              <Text style={styles.userMetaLabel}>
                {t("results.detail.tickets")}
              </Text>
              <Text style={styles.userMetaValue}>{data.ticketsLabel}</Text>
            </View>
            {data.winnerPosition != null ? (
              <View style={styles.userMetaRow}>
                <Text style={styles.userMetaLabel}>
                  {t("results.detail.rank")}
                </Text>
                <Text style={styles.userMetaValue}>
                  {t("results.list.winnerPosition", {
                    position: data.winnerPosition,
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        <SectionHeader title={t("results.detail.winnersSection")} />
        {data.winners.length === 0 ? (
          <Text style={styles.helperInline}>
            {t("results.detail.noWinnersYet")}
          </Text>
        ) : (
          <ListGroup>
            {data.winners.map((w, idx) => {
              const isMe =
                data.winnerPosition != null &&
                w.position === data.winnerPosition;
              return (
                <View
                  key={w.position}
                  style={[
                    styles.winnerRow,
                    idx === 0 && styles.winnerRowFirst,
                    isMe && styles.winnerRowMe,
                  ]}
                >
                  <View style={styles.winnerLeft}>
                    <Text style={styles.winnerRank}>#{w.position}</Text>
                    <Text style={styles.winnerName} numberOfLines={1}>
                      {w.maskedUsername}
                    </Text>
                  </View>
                  {isMe ? (
                    <Badge tone="accent">{t("results.detail.you")}</Badge>
                  ) : null}
                </View>
              );
            })}
          </ListGroup>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  headerWrap: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  iconHit: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  helper: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  helperInline: {
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 15,
  },
  retryWrap: {
    marginTop: theme.spacing.lg,
    alignSelf: "stretch",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  lotteryCard: {
    padding: 0,
  },
  lotteryMedia: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.surfaceSoft,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    overflow: "hidden",
  },
  lotteryImage: {
    width: "100%",
    height: "100%",
  },
  lotteryBody: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  lotteryTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  metaMuted: {
    color: theme.colors.textMutedAccent,
    fontSize: 13,
    fontWeight: "600",
  },
  userHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  userTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  userMetaGrid: {
    gap: theme.spacing.sm,
  },
  userMetaRow: {
    gap: 2,
  },
  userMetaLabel: {
    color: theme.colors.textMutedAccent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  userMetaValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  winnerRow: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
  },
  winnerRowFirst: {
    borderTopWidth: 0,
  },
  winnerRowMe: {
    backgroundColor: theme.colors.accentWash,
  },
  winnerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  winnerRank: {
    width: 44,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  winnerName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.textMutedAccent,
    fontSize: 14,
    fontWeight: "700",
  },
});
