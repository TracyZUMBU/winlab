import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme";

import { formatAbsoluteDateFr } from "@/src/lib/date/format";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { usePendingRewardsQuery } from "../hooks/usePendingRewardsQuery";
import { usePurchasedTicketsQuery } from "../hooks/usePurchasedTicketsQuery";
import { useWalletBalanceQuery } from "../hooks/useWalletBalanceQuery";
import { useWalletTransactionsQuery } from "../hooks/useWalletTransactionsQuery";

export function WalletScreen() {
  const { t } = useTranslation();

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

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
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

  const balanceFormatted = balanceQuery.data?.balanceFormatted ?? "";
  const pendingRewardsFormatted =
    pendingRewardsQuery.data?.pendingRewardsFormatted ?? "";
  const transactions = transactionsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wallet.balance")}</Text>
          <Text style={styles.value}>{balanceFormatted}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wallet.pendingRewards")}</Text>
          <Text style={[styles.value, { color: theme.colors.accentSolid }]}>
            {pendingRewardsFormatted}
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wallet.transactions")}</Text>

          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>{t("wallet.noTransactions")}</Text>
          ) : null}

          {transactions.map((tx, index) => (
            <View
              key={
                tx.reference_id ??
                `${tx.reference_type ?? "unknown"}-${tx.reference_id ?? ""}-${tx.created_at}-${index}`
              }
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>{tx.label}</Text>
                <Text style={styles.rowSubtitle}>{tx.subtitle}</Text>
              </View>
              <Text
                style={[
                  styles.rowAmount,
                  tx.direction === "credit"
                    ? { color: theme.colors.success }
                    : { color: theme.colors.accentSolid },
                ]}
              >
                {tx.amountFormatted}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wallet.tickets")}</Text>

          {tickets.length === 0 ? (
            <Text style={styles.emptyText}>{t("wallet.noTickets")}</Text>
          ) : null}

          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>{ticket.lottery_title}</Text>
                <Text style={styles.rowSubtitle}>
                  {ticket.lottery_status_label}
                </Text>
              </View>
              <Text style={styles.ticketDate}>
                {formatAbsoluteDateFr(ticket.purchased_at)}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    marginTop: theme.spacing.sm,
  },
  rowLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs / 2,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  ticketDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "600",
    paddingLeft: theme.spacing.sm,
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
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
