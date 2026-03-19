import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import i18n from "@/src/i18n";
import { getRelativeDayBucket } from "@/src/lib/date/format";
import {
  getWalletTransactions,
  type WalletTransactionRow,
} from "../services/getWalletTransactions";

export type WalletTransactionUi = {
  amount: number;
  direction: WalletTransactionRow["direction"];
  transaction_type: WalletTransactionRow["transaction_type"];
  reference_type: WalletTransactionRow["reference_type"];
  reference_id: WalletTransactionRow["reference_id"];
  created_at: string;

  amountFormatted: string; // +XX or -XX
  label: string; // Mission completed, Lottery entry, ...
  subtitle: string; // Completed • Today, Entry Fee • Yesterday, ...
};

function formatTokenAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (Number.isInteger(abs)) return abs.toString();
  const rounded = Math.round(abs * 100) / 100;
  return rounded.toString();
}

function formatRelativeDayLabel(iso: string): string {
  const bucket = getRelativeDayBucket(iso);

  switch (bucket.kind) {
    case "today":
      return i18n.t("date.today");
    case "yesterday":
      return i18n.t("date.yesterday");
    case "daysAgo":
      return i18n.t("date.daysAgo", { days: bucket.days });
    case "unknown":
      return i18n.t("date.unknown");
  }
}

function mapTransactionTypeToLabel(
  transactionType: WalletTransactionRow["transaction_type"],
): string {
  switch (transactionType) {
    case "mission_reward":
      return i18n.t("wallet.missionCompleted");
    case "ticket_purchase":
      return i18n.t("wallet.ticketPurchase");
    case "referral_bonus":
      return i18n.t("wallet.referralBonus");
    case "token_purchase":
      return i18n.t("wallet.tokenPurchase");
    default:
      return i18n.t("wallet.activity");
  }
}

function mapTransactionTypeToPrefix(
  transactionType: WalletTransactionRow["transaction_type"],
): string {
  switch (transactionType) {
    case "mission_reward":
      return i18n.t("wallet.completed");
    case "ticket_purchase":
      return i18n.t("wallet.entryFee");
    case "referral_bonus":
      return i18n.t("wallet.earned");
    case "token_purchase":
      return i18n.t("wallet.earned");
    default:
      return i18n.t("wallet.activity");
  }
}

function mapRowToUi(row: WalletTransactionRow): WalletTransactionUi {
  const sign = row.direction === "credit" ? "+" : "-";
  const amountFormatted = `${sign}${formatTokenAmount(row.amount)}`;
  const label = mapTransactionTypeToLabel(row.transaction_type);
  const prefix = mapTransactionTypeToPrefix(row.transaction_type);
  const relative = formatRelativeDayLabel(row.created_at);

  return {
    ...row,
    amountFormatted,
    label,
    subtitle: `${prefix} • ${relative}`,
  };
}

export function useWalletTransactionsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["wallet", "transactions", userId],
    queryFn: () => getWalletTransactions(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
    select: (rows): WalletTransactionUi[] => rows.map(mapRowToUi),
  });
}
