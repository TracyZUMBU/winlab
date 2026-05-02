import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { WalletTransactionUi } from "../hooks/useWalletTransactionsQuery";

import { theme } from "@/src/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

function iconForTransaction(
  transactionType: WalletTransactionUi["transaction_type"],
): { name: MaterialIconName; credit: boolean } {
  switch (transactionType) {
    case "mission_reward":
      return { name: "workspace-premium", credit: true };
    case "ticket_purchase":
      return { name: "confirmation-number", credit: false };
    case "referral_bonus":
      return { name: "card-giftcard", credit: true };
    case "token_purchase":
      return { name: "add-circle", credit: true };
    case "signup_bonus":
      return { name: "handshake", credit: true };
    default:
      return { name: "swap-horiz", credit: true };
  }
}

export type WalletTransactionRowProps = {
  transaction: WalletTransactionUi;
  dimmed?: boolean;
};

export function WalletTransactionRow({
  transaction,
  dimmed,
}: WalletTransactionRowProps) {
  const { name, credit: iconCredit } = iconForTransaction(
    transaction.transaction_type,
  );
  const isCredit = transaction.direction === "credit";
  const usePositiveTint = iconCredit && isCredit;
  const iconBg = usePositiveTint
    ? theme.colors.semantic.successMuted
    : theme.colors.dangerMuted;
  const iconColor = usePositiveTint
    ? theme.colors.success
    : theme.colors.dangerSolid;
  const amountColor = isCredit
    ? theme.colors.success
    : theme.colors.dangerSolid;

  return (
    <View style={[styles.row, dimmed && styles.rowDimmed]}>
      <View style={[styles.iconOuter, { backgroundColor: iconBg }]}>
        <MaterialIcons name={name} size={26} color={iconColor} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={2}>
          {transaction.label}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {transaction.subtitle}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {transaction.amountFormatted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  rowDimmed: {
    opacity: 0.82,
  },
  iconOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
  },
});
