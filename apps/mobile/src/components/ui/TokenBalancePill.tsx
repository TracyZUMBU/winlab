import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useWalletBalanceQuery } from "@/src/features/wallet/hooks/useWalletBalanceQuery";
import { theme } from "@/src/theme";

export function TokenBalancePill() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useWalletBalanceQuery();

  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";
  const amount =
    data == null
      ? isLoading
        ? "…"
        : "0"
      : new Intl.NumberFormat(locale).format(data.balance);
  const a11yAmount = isLoading ? t("common.loading") : amount;

  return (
    <View
      style={styles.root}
      accessibilityRole="text"
      accessibilityLabel={t("common.a11y.tokenBalance", { amount: a11yAmount })}
    >
      <MaterialIcons name="token" size={16} color={theme.colors.accent} />
      <Text style={styles.text}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
