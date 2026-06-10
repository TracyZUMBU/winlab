import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";

export type HomeCurrentBalanceCardProps = {
  balanceLabel: string;
  tokensLabel: string;
  onPressUseTokens: () => void;
};

export function HomeCurrentBalanceCard({
  balanceLabel,
  tokensLabel,
  onPressUseTokens,
}: HomeCurrentBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.labelRow}>
        <MaterialCommunityIcons
          name="wallet"
          size={18}
          color={theme.colors.onAccent}
        />
        <Text style={styles.label}>{t("home.balance.label")}</Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{balanceLabel}</Text>
        <Text style={styles.tokensWord}>{tokensLabel}</Text>
      </View>
      <Button
        title={t("home.balance.useTokens")}
        onPress={onPressUseTokens}
        fullWidth
        style={styles.useTokensButton}
        textStyle={styles.useTokensButtonText}
        leftIcon={
          <MaterialIcons
            name="stars"
            size={20}
            color={theme.colors.accentSolid}
          />
        }
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    alignItems: "center",
    backgroundColor: theme.colors.accentSolid,
    borderColor: theme.colors.accentSolid,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.85)",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  amount: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: theme.colors.onAccent,
  },
  tokensWord: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.9)",
  },
  useTokensButton: {
    backgroundColor: theme.colors.onAccent,
    shadowOpacity: 0,
    elevation: 0,
  },
  useTokensButtonText: {
    color: theme.colors.accentSolid,
  },
});
