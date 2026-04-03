import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WalletBalanceHero } from "../components/WalletBalanceHero";
import { WalletTicketRow } from "../components/WalletTicketRow";
import { WalletTransactionRow } from "../components/WalletTransactionRow";
import { usePendingRewardsQuery } from "../hooks/usePendingRewardsQuery";
import { usePurchasedTicketsQuery } from "../hooks/usePurchasedTicketsQuery";
import { useWalletBalanceQuery } from "../hooks/useWalletBalanceQuery";
import type { WalletTransactionUi } from "../hooks/useWalletTransactionsQuery";
import { useWalletTransactionsQuery } from "../hooks/useWalletTransactionsQuery";

import { AppHeaderFull } from "@/src/components/ui/AppHeaderFull";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";
import { formatAbsoluteDateFr } from "@/src/lib/date/format";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";
import { showInfoToast } from "@/src/shared/toast";

type WalletSegmentId = "history" | "tickets";
type ActivityFilterId = "all" | "credit" | "debit";

function formatTokenNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    value,
  );
}

export function WalletScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [segment, setSegment] = useState<WalletSegmentId>("history");
  const [activityFilter, setActivityFilter] = useState<ActivityFilterId>("all");

  const balanceQuery = useWalletBalanceQuery();
  const pendingRewardsQuery = usePendingRewardsQuery();
  const transactionsQuery = useWalletTransactionsQuery();
  const ticketsQuery = usePurchasedTicketsQuery();

  const isLoading =
    balanceQuery.isLoading ||
    pendingRewardsQuery.isLoading ||
    transactionsQuery.isLoading ||
    ticketsQuery.isLoading;

  const error =
    balanceQuery.error ??
    pendingRewardsQuery.error ??
    transactionsQuery.error ??
    ticketsQuery.error;

  const balanceDisplay = useMemo(() => {
    const n = balanceQuery.data?.balance ?? 0;
    return formatTokenNumber(n, i18n.language);
  }, [balanceQuery.data?.balance, i18n.language]);

  const pendingDisplay = useMemo(() => {
    const n = pendingRewardsQuery.data?.pendingRewards ?? 0;
    const formatted = formatTokenNumber(n, i18n.language);
    return n > 0 ? `+${formatted}` : formatted;
  }, [pendingRewardsQuery.data?.pendingRewards, i18n.language]);

  const transactions = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  const filteredTransactions = useMemo(() => {
    if (activityFilter === "all") return transactions;
    return transactions.filter((tx) => tx.direction === activityFilter);
  }, [transactions, activityFilter]);

  const onCycleFilter = () => {
    setActivityFilter((prev) =>
      prev === "all" ? "credit" : prev === "credit" ? "debit" : "all",
    );
  };

  const onWalletInfo = () => {
    showInfoToast({
      title: t("wallet.info.title"),
      message: t("wallet.info.message"),
    });
  };

  const onEarnMore = () => {
    router.push("/missions");
  };

  const listBottomPadding =
    theme.spacing.xl + Math.max(insets.bottom, theme.spacing.md);

  if (isLoading) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("wallet.screen.error")}</Text>
          <Text style={[styles.errorText, styles.errorHint]}>
            {userFacingQueryLoadHint(t)}
          </Text>
          <View style={styles.retryButton}>
            <Button
              title={t("common.retry")}
              onPress={() => {
                void balanceQuery.refetch();
                void pendingRewardsQuery.refetch();
                void transactionsQuery.refetch();
                void ticketsQuery.refetch();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <View style={styles.headerWrap}>
        <AppHeaderFull
          title={t("wallet.layout.title")}
          titleAlign="center"
          showBottomBorder={false}
          leftSlot={
            router.canGoBack() ? (
              <Pressable
                onPress={() => router.back()}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel={t("wallet.a11y.back")}
              >
                <MaterialIcons
                  name="arrow-back-ios-new"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            ) : undefined
          }
          rightSlot={
            <Pressable
              onPress={onWalletInfo}
              style={styles.iconHit}
              accessibilityRole="button"
              accessibilityLabel={t("wallet.a11y.info")}
            >
              <MaterialIcons
                name="info-outline"
                size={24}
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
          { paddingBottom: listBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <WalletBalanceHero
          totalBalanceLabel={t("wallet.hero.totalBalance")}
          balanceDisplay={balanceDisplay}
          tokensLabel={t("wallet.hero.tokens")}
          pendingLabel={t("wallet.hero.pendingRewards")}
          pendingDisplay={pendingDisplay}
          earnMoreLabel={t("wallet.hero.earnMore")}
          onEarnMore={onEarnMore}
        />

        <SegmentedControl
          items={[
            { value: "history", label: t("wallet.tab.history") },
            { value: "tickets", label: t("wallet.tab.myTickets") },
          ]}
          value={segment}
          onValueChange={setSegment}
        />

        {segment === "history" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t("wallet.recentActivity")}
              </Text>
              <Pressable
                onPress={onCycleFilter}
                accessibilityRole="button"
                accessibilityLabel={t("wallet.filter.a11y")}
              >
                <Text style={styles.filterAction}>
                  {t("wallet.filter.action")}
                </Text>
              </Pressable>
            </View>

            {filteredTransactions.length === 0 ? (
              <Text style={styles.emptyText}>{t("wallet.noTransactions")}</Text>
            ) : (
              <View style={styles.listGap}>
                {filteredTransactions.map((tx, index) => (
                  <WalletTransactionRow
                    key={rowKey(tx)}
                    transaction={tx}
                    dimmed={index >= 3}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.ticketsSectionTitle]}>
              {t("wallet.tickets")}
            </Text>
            {tickets.length === 0 ? (
              <Text style={styles.emptyText}>{t("wallet.noTickets")}</Text>
            ) : (
              <View style={styles.listGap}>
                {tickets.map((ticket, index) => (
                  <WalletTicketRow
                    key={ticket.id}
                    ticket={ticket}
                    dateLabel={formatAbsoluteDateFr(ticket.purchased_at)}
                    dimmed={index >= 3}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function rowKey(tx: WalletTransactionUi): string {
  return tx.id;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  headerWrap: {
    paddingHorizontal: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconHit: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.text,
  },
  ticketsSectionTitle: {
    marginBottom: -theme.spacing.xs,
  },
  filterAction: {
    color: theme.colors.accentSolid,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  listGap: {
    gap: theme.spacing.sm + 2,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    alignSelf: "stretch",
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "center",
  },
  errorHint: {
    marginTop: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
