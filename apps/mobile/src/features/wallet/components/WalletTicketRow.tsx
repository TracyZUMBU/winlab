import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import type { PurchasedTicketUi } from "../hooks/usePurchasedTicketsQuery";

import { theme } from "@/src/theme";

export type WalletTicketRowProps = {
  ticket: PurchasedTicketUi;
  dateLabel: string;
  dimmed?: boolean;
};

export function WalletTicketRow({
  ticket,
  dateLabel,
  dimmed,
}: WalletTicketRowProps) {
  return (
    <View style={[styles.row, dimmed && styles.rowDimmed]}>
      <View style={styles.iconOuter}>
        <MaterialIcons
          name="confirmation-number"
          size={26}
          color={theme.colors.accentSolid}
        />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={2}>
          {ticket.lottery_title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {ticket.lottery_status_label}
        </Text>
      </View>
      <Text style={styles.date}>{dateLabel}</Text>
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
    backgroundColor: theme.colors.accentWash,
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
  date: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.xs,
  },
});
