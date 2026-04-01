import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useNow } from "@/src/lib/date/useNow";
import { theme } from "@/src/theme";

import { getCountdownParts } from "../utils/lotteryTime";

export function LotteryCountdownTimer({ endsAt }: { endsAt: string | null }) {
  const { t } = useTranslation();
  const nowMs = useNow({ intervalMs: 1000 });
  const parts = getCountdownParts(endsAt, nowMs);

  const digits =
    parts.kind === "remaining"
      ? parts
      : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const pad2 = (value: number) => String(value).padStart(2, "0");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("lottery.detail.countdown.title")}</Text>
      <View style={styles.row}>
        <TimeBox
          value={pad2(digits.days)}
          label={t("lottery.detail.countdown.daysLabel")}
        />
        <TimeBox
          value={pad2(digits.hours)}
          label={t("lottery.detail.countdown.hoursLabel")}
        />
        <TimeBox
          value={pad2(digits.minutes)}
          label={t("lottery.detail.countdown.minutesLabel")}
        />
        <TimeBox
          value={pad2(digits.seconds)}
          label={t("lottery.detail.countdown.secondsLabel")}
          accent
        />
      </View>
    </View>
  );
}

function TimeBox({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.boxCol}>
      <View style={[styles.box, accent ? styles.boxAccent : null]}>
        <Text style={[styles.value, accent ? styles.valueOnAccent : null]}>
          {value}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textMuted,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  boxCol: {
    flex: 1,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  box: {
    width: 72,
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  boxAccent: {
    backgroundColor: theme.colors.accentSolid,
    borderColor: theme.colors.accentSolid,
    shadowColor: theme.colors.accentSolid,
    shadowOpacity: 0.35,
  },
  value: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  valueOnAccent: {
    color: theme.colors.backgroundDark,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
});
