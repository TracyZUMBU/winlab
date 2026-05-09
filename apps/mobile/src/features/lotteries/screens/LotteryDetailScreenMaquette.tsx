import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LotteryCountdownTimer } from "../components/LotteryCountdownTimer";
import { useBuyTicketMutation } from "../hooks/useBuyTicketMutation";
import { useLotteryDetailQuery } from "../hooks/useLotteryDetailQuery";

import { AppHeader } from "@/src/components/ui/AppHeader";
import { Screen } from "@/src/components/ui/Screen";
import { useWalletBalanceQuery } from "@/src/features/wallet/hooks/useWalletBalanceQuery";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { theme } from "@/src/theme";

const ONE_TICKET = 1;

export function LotteryDetailScreenMaquette() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{
    lotteryId?: string | string[];
  }>();

  const lotteryId = useMemo(() => {
    const raw = params.lotteryId;
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0)
      return raw[0];
    return undefined;
  }, [params.lotteryId]);

  const { data, isLoading, isError, refetch } =
    useLotteryDetailQuery(lotteryId);
  const { data: walletBalanceData } = useWalletBalanceQuery();

  const walletBalance = walletBalanceData?.balance ?? null;
  const { mutateAsync, isPending } = useBuyTicketMutation();
  const [buyError, setBuyError] = useState<string | null>(null);

  const eligible =
    data?.ticket_cost != null && walletBalance != null
      ? walletBalance >= data.ticket_cost * ONE_TICKET
      : false;

  const onBuyTicket = async () => {
    if (!lotteryId) return;
    setBuyError(null);

    try {
      const result = await mutateAsync({ lotteryId });
      if (result.success) {
        await refetch();
        return;
      }

      if (result.kind === "business") {
        setBuyError(
          getI18nMessageForCode({
            t,
            i18n,
            baseKey: "lottery.detail.purchase.errors",
            code: result.errorCode,
            fallbackKey: "lottery.detail.purchase.errors.generic",
          }),
        );
        return;
      }

      setBuyError(t("lottery.detail.purchase.errors.generic"));
    } catch {
      setBuyError(t("lottery.detail.purchase.errors.generic"));
    }
  };

  if (isError) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("lottery.detail.error")}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (isLoading || !data) {
    return (
      <Screen edges={["top"]} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("lottery.detail.loading")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <AppHeader
            title={t("lotteries.layout.detail")}
            titleAlign="center"
            showBottomBorder
            leftSlot={
              <Pressable
                onPress={() => router.back()}
                style={styles.iconCircle}
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="arrow-back-ios-new"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            }
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroOuter}>
            <View style={styles.heroMedia}>
              {data.image_url ? (
                <Image
                  source={{ uri: data.image_url }}
                  style={styles.heroImage}
                />
              ) : (
                <View style={styles.heroPlaceholder} />
              )}
            </View>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleBlockTop}>
              {(data.category ?? "").trim() ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {(data.category ?? "").trim().toUpperCase()}
                  </Text>
                </View>
              ) : null}

              {data.brand?.name ? (
                <Text style={styles.brand}>{data.brand.name}</Text>
              ) : null}
            </View>
            <Text style={styles.bigTitle} numberOfLines={2}>
              {data.title}
            </Text>

            {data.short_description ? (
              <Text style={styles.subtitle}>{data.short_description}</Text>
            ) : null}
          </View>

          <LotteryCountdownTimer endsAt={data.ends_at} />

          <View style={styles.participationCard}>
            <View style={styles.participationCardRow}>
              <View style={styles.participationLeft}>
                <Text style={styles.participationPrimaryLine}>
                  {t("lottery.detail.tokensPerTicket", {
                    count: data.ticket_cost,
                  })}
                </Text>

                <View style={styles.balanceLine}>
                  <Text style={styles.balancePrefix}>
                    {t("lottery.detail.currentBalancePrefix")}
                  </Text>
                  {walletBalance == null ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.accentSolid}
                    />
                  ) : (
                    <Text style={styles.balanceAmount}>{walletBalance}</Text>
                  )}
                  <Text style={styles.balanceSuffix}>
                    {t("lottery.detail.currentBalanceSuffix")}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.gainMore}
                onPress={() => router.push("/missions")}
                accessibilityRole="button"
              >
                <Text style={styles.gainMoreText}>
                  {t("lottery.detail.gainMore")}
                </Text>
                <MaterialIcons
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.accentSolid}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.yourParticipationCard}>
            <View style={styles.yourParticipationIcon}>
              <MaterialIcons
                name="confirmation-number"
                size={22}
                color={theme.colors.textMutedAccent}
              />
            </View>
            <View style={styles.yourParticipationTexts}>
              <Text style={styles.yourParticipationLabel}>
                {t("lottery.detail.yourParticipation")}
              </Text>
              <Text style={styles.yourParticipationValue}>
                {data.userTicketsLabel}
              </Text>
            </View>
          </View>

          {buyError ? <Text style={styles.buyError}>{buyError}</Text> : null}

          <View style={styles.aboutBlock}>
            <Text style={styles.aboutTitle}>
              {t("lottery.detail.aboutTitle")}
            </Text>
            {data.description ? (
              <Text style={styles.aboutDescription}>{data.description}</Text>
            ) : null}

            <View style={styles.featurePills}>
              <View style={styles.featurePill}>
                <MaterialIcons
                  name="lock-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.featurePillText}>
                  {t("lottery.detail.featurePills.certifiedDraw")}
                </Text>
              </View>
              <View style={styles.featurePill}>
                <MaterialIcons
                  name="local-shipping"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.featurePillText}>
                  {t("lottery.detail.featurePills.freeDelivery")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: theme.spacing.sm }]}>
          <View style={styles.footerTopRow}>
            <Text style={styles.footerPrice}>
              {t("lottery.detail.footer.totalPriceLabel", {
                count: data.ticket_cost * ONE_TICKET,
              })}
            </Text>
            <Text
              style={[
                styles.footerEligibility,
                {
                  color: eligible
                    ? theme.colors.accentSolid
                    : theme.colors.dangerSolid,
                },
              ]}
            >
              {eligible
                ? t("lottery.detail.footer.eligible")
                : t("lottery.detail.footer.notEligible")}
            </Text>
          </View>

          <Pressable
            onPress={() => void onBuyTicket()}
            disabled={isPending || !eligible}
            style={[
              styles.buyCta,
              (isPending || !eligible) && styles.buyCtaDisabled,
            ]}
          >
            <Text style={styles.buyCtaText}>
              {isPending
                ? t("lottery.detail.footer.buyingTicketLabel")
                : t("lottery.detail.footer.buyTicketLabel")}
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={20}
              color={theme.colors.backgroundDark}
            />
          </Pressable>

          <Text style={styles.footerNote}>
            {t("lottery.detail.footer.noteBeforeTerms")}{" "}
            <Text style={styles.footerNoteLink}>
              {t("lottery.detail.footer.noteTermsLabel")}
            </Text>{" "}
            {t("lottery.detail.footer.noteAfterTerms")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  root: {
    flex: 1,
  },
  topBar: {
    backgroundColor: theme.colors.backgroundHeader,
    paddingHorizontal: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  shareIconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  helper: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMutedAccent,
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
  heroOuter: {
    marginTop: theme.spacing.sm,
  },
  heroMedia: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceSoft,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surfaceSoft,
  },
  verifiedBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  titleBlock: {
    gap: theme.spacing.xs,
  },
  titleBlockTop: {
    flexDirection: "row",

    alignItems: "center",
    gap: theme.spacing.md,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  categoryPillText: {
    color: theme.colors.accentSolid,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  brand: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  bigTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginTop: -theme.spacing.xs,
  },
  sectionGap: {
    height: theme.spacing.md,
  },
  participationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.md,
  },
  participationCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  participationLeft: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  participationPrimaryLine: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.text,
  },
  balanceLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  balancePrefix: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "400",
  },
  balanceAmount: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "600",
  },
  balanceSuffix: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "600",
  },
  gainMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  gainMoreText: {
    color: theme.colors.accentSolid,
    fontWeight: "900",
    fontSize: 13,
  },
  yourParticipationCard: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  yourParticipationIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentBorderMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  yourParticipationTexts: {
    flex: 1,
  },
  yourParticipationLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  yourParticipationValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  buyError: {
    color: theme.colors.dangerSolid,
    fontSize: 14,
    fontWeight: "700",
    marginTop: -theme.spacing.sm,
  },
  aboutBlock: {
    gap: theme.spacing.sm,
  },
  aboutTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  aboutDescription: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 20,
  },
  featurePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  featurePillText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  footerPrice: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  footerEligibility: {
    fontSize: 12,
    fontWeight: "900",
  },
  buyCta: {
    height: 50,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.accentSolid,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: theme.colors.accentSolid,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  buyCtaDisabled: {
    opacity: 0.55,
  },
  buyCtaText: {
    color: theme.colors.backgroundDark,
    fontSize: 18,
    fontWeight: "900",
  },
  footerNote: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
  },
  footerNoteLink: {
    textDecorationLine: "underline",
    color: theme.colors.textMutedAccent,
    fontWeight: "800",
  },
});
