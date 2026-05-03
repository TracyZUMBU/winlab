import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { format, parseISO } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";

import type { MissionDetailCompletion } from "../services/getMissionById";

type Variant = "approved" | "pending";

type Props = {
  variant: Variant;
  completion: MissionDetailCompletion;
};

function pickOutcomeTimestampIso(completion: MissionDetailCompletion): string | null {
  return (
    completion.completed_at ??
    completion.reviewed_at ??
    completion.created_at ??
    null
  );
}

export function MissionDetailReadonlyOutcome({ variant, completion }: Props) {
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language?.toLowerCase().startsWith("fr") ? fr : enUS;
  const formattedDate = useMemo(() => {
    const iso = pickOutcomeTimestampIso(completion);
    if (!iso) return null;
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) return null;
    return format(d, "d MMM yyyy, HH:mm", { locale: dateLocale });
  }, [completion, dateLocale]);

  const titleKey =
    variant === "approved"
      ? "missions.detail.outcome.approved.title"
      : "missions.detail.outcome.pending.title";
  const subtitleKey =
    variant === "approved"
      ? "missions.detail.outcome.approved.subtitle"
      : "missions.detail.outcome.pending.subtitle";
  const dateLabelKey = "missions.detail.outcome.dateLabel";

  const iconName = variant === "approved" ? "check-circle" : "schedule";
  const iconColor =
    variant === "approved" ? theme.colors.accentSolid : theme.colors.textMutedAccent;

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.iconRow}>
        <MaterialIcons name={iconName} size={40} color={iconColor} />
      </View>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
      {formattedDate ? (
        <Text style={styles.date}>
          {t(dateLabelKey, { date: formattedDate })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.borderSubtle,
  },
  iconRow: {
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.cardBody,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textMutedAccent,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
});
