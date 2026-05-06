import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { theme } from "@/src/theme";
import { mixHex } from "@/src/theme/mixHex";

const HERO_GRADIENT_END = mixHex(
  theme.colors.backgroundDark,
  theme.colors.accentSolid,
  0.14,
);

export type WalletBalanceHeroProps = {
  totalBalanceLabel: string;
  balanceDisplay: string;
  tokensLabel: string;
  pendingLabel: string;
  pendingDisplay: string;
  earnMoreLabel: string;
  onEarnMore: () => void;
};

export function WalletBalanceHero({
  totalBalanceLabel,
  balanceDisplay,
  tokensLabel,
  pendingLabel,
  pendingDisplay,
  earnMoreLabel,
  onEarnMore,
}: WalletBalanceHeroProps) {
  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[theme.colors.backgroundDark, HERO_GRADIENT_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View
          style={styles.glow}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View style={styles.inner}>
          <Text style={styles.totalBalanceLabel}>{totalBalanceLabel}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balanceDisplay}</Text>
            <Text style={styles.tokensLabel}>{tokensLabel}</Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.pendingBlock}>
              <Text style={styles.pendingLabel}>{pendingLabel}</Text>
              <Text style={styles.pendingValue}>{pendingDisplay}</Text>
            </View>
            <Button
              title={earnMoreLabel}
              onPress={onEarnMore}
              style={styles.earnButton}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  gradient: {
    padding: theme.spacing.lg + 4,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.accentMuted,
    opacity: 0.85,
  },
  inner: {
    gap: theme.spacing.xs,
  },
  totalBalanceLabel: {
    color: theme.colors.onAccent,
    opacity: 0.72,
    fontSize: 14,
    fontWeight: "600",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  balanceAmount: {
    color: theme.colors.onAccent,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tokensLabel: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  footerRow: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  pendingBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pendingLabel: {
    color: theme.colors.onAccent,
    opacity: 0.55,
    fontSize: 12,
    fontWeight: "500",
  },
  pendingValue: {
    color: theme.colors.onAccent,
    fontSize: 16,
    fontWeight: "700",
  },
  earnButton: {
    flexShrink: 0,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md + 2,
  },
});
