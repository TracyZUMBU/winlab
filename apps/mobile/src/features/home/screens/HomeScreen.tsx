import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppUserHeaderBar } from "@/src/components/ui/AppUserHeaderBar";
import { Screen } from "@/src/components/ui/Screen";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { HomeCurrentBalanceCard } from "../components/HomeCurrentBalanceCard";
import { HomeMissionTeaserRow } from "../components/HomeMissionTeaserRow";
import { HomeOngoingLotteryCard } from "../components/HomeOngoingLotteryCard";
import { HomeParticipationRow } from "../components/HomeParticipationRow";
import { useHomeDashboardQuery } from "../hooks/useHomeDashboardQuery";
import type {
  HomeDashboardMissionPreview,
  HomeDashboardParticipation,
} from "../types/homeDashboard";
export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  const { data, isLoading, isError, refetch, isFetching } =
    useHomeDashboardQuery();

  const displayName = useMemo(() => {
    const raw = data?.profile.username?.trim();
    if (raw) return raw;
    return t("home.greeting.anonymousName");
  }, [data?.profile.username, t]);

  const balanceFormatted = useMemo(() => {
    if (data == null) return "0";
    return new Intl.NumberFormat(locale).format(data.wallet_balance);
  }, [data, locale]);

  const formatDrawDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatChance = (p: number | null) => {
    if (p == null || !Number.isFinite(p)) {
      return t("home.participations.chanceUnknown");
    }
    return t("home.participations.chancePercent", {
      value: (p * 100).toFixed(1),
    });
  };

  const missionSubtitle = (m: HomeDashboardMissionPreview) => {
    if (m.mission_type === "referral") {
      return t("home.missions.subtitle.referral");
    }
    return t("home.missions.availability", {
      used: m.user_completions_used,
      max: m.max_completions_per_user,
    });
  };

  const onOpenWallet = () => {
    trackEvent("home_open_wallet");
    router.push("/wallet");
  };

  const onOpenLotteries = () => {
    trackEvent("home_open_lotteries_all");
    router.push("/lotteries/all");
  };

  const onOpenMissions = () => {
    trackEvent("home_open_missions_all");
    router.push("/missions");
  };

  const onOpenLottery = (lotteryId: string) => {
    router.push(`/lotteries/${lotteryId}`);
  };

  const onOpenMission = (missionId: string) => {
    router.push(`/missions/${missionId}`);
  };

  if (isLoading && !data) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.pad}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.accentSolid} />
            <Text style={styles.helper}>{t("home.loading")}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.pad}>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{t("home.error")}</Text>
            <Text style={styles.helper}>{userFacingQueryLoadHint(t)}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void refetch()}
            >
              <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <View style={styles.mainColumn}>
        <AppUserHeaderBar />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pad}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingTitle}>
                {t("home.greeting.title", { name: displayName })}
              </Text>
              <Text style={styles.greetingSubtitle}>
                {t("home.greeting.subtitle")}
              </Text>
            </View>

            <HomeCurrentBalanceCard
              balanceLabel={balanceFormatted}
              tokensLabel={t("wallet.hero.tokens")}
              onPressUseTokens={onOpenWallet}
            />

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t("home.lotteries.sectionTitle")}
              </Text>
              <Pressable onPress={onOpenLotteries} accessibilityRole="button">
                <Text style={styles.sectionAction}>
                  {t("home.lotteries.seeAll")}
                </Text>
              </Pressable>
            </View>

            {data.ongoing_lotteries.length === 0 ? (
              <Text style={styles.emptyHint}>{t("home.lotteries.empty")}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              >
                {data.ongoing_lotteries.map((lottery) => (
                  <HomeOngoingLotteryCard
                    key={lottery.id}
                    lottery={lottery}
                    onPress={onOpenLottery}
                  />
                ))}
              </ScrollView>
            )}

            <Text style={[styles.sectionTitle, styles.sectionBlock]}>
              {t("home.participations.sectionTitle")}
            </Text>

            {data.participations.length === 0 ? (
              <Text style={styles.emptyHint}>
                {t("home.participations.empty")}
              </Text>
            ) : (
              <View style={styles.stack}>
                {data.participations.map((p: HomeDashboardParticipation) => (
                  <HomeParticipationRow
                    key={p.lottery_id}
                    participation={p}
                    drawDateLabel={t("home.participations.drawOn", {
                      date: formatDrawDate(p.draw_at),
                    })}
                    ticketsLabel={t("home.participations.tickets", {
                      count: p.user_ticket_count,
                    })}
                    chanceLabel={formatChance(p.win_probability)}
                    onPress={onOpenLottery}
                  />
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, styles.sectionBlock]}>
              {t("home.missions.sectionTitle")}
            </Text>

            {data.mission_previews.length === 0 ? (
              <Text style={styles.emptyHint}>{t("home.missions.empty")}</Text>
            ) : (
              <View style={styles.stack}>
                {data.mission_previews.map((m) => (
                  <HomeMissionTeaserRow
                    key={m.id}
                    mission={m}
                    subtitle={missionSubtitle(m)}
                    rewardLabel={t("missions.card.tokenReward", {
                      count: m.token_reward,
                    })}
                    onPress={onOpenMission}
                  />
                ))}
              </View>
            )}

            <Pressable
              style={styles.missionsCta}
              onPress={onOpenMissions}
              accessibilityRole="button"
            >
              <Text style={styles.missionsCtaText}>
                {t("home.missions.seeAll")}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.accentSolid}
              />
            </Pressable>

            {isFetching && !isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.accentSolid}
                style={styles.refetchSpinner}
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainColumn: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingBottom: theme.spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  greetingBlock: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  sectionBlock: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionAction: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "800",
  },
  carousel: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  stack: {
    gap: theme.spacing.md,
  },
  emptyHint: {
    color: theme.colors.textMutedAccent,
    fontSize: 14,
    fontWeight: "600",
  },
  missionsCta: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentWash,
  },
  missionsCtaText: {
    color: theme.colors.accentSolid,
    fontSize: 14,
    fontWeight: "800",
  },
  quickLinks: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  quickLinksTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.text,
  },
  quickLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  quickLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
    minHeight: 240,
  },
  helper: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 15,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: "600",
  },
  refetchSpinner: {
    marginTop: theme.spacing.md,
  },
});
