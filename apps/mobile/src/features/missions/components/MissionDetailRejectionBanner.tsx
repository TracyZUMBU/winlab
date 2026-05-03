import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { format, parseISO } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { theme } from "@/src/theme";

import type { MissionDetailCompletion } from "../services/getMissionById";

type Props = {
  completion: MissionDetailCompletion;
};

export function MissionDetailRejectionBanner({ completion }: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.toLowerCase().startsWith("fr") ? fr : enUS;

  const formattedDate = useMemo(() => {
    const iso = completion.reviewed_at ?? completion.created_at;
    if (!iso) return null;
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) return null;
    return format(d, "d MMM yyyy, HH:mm", { locale: dateLocale });
  }, [completion.created_at, completion.reviewed_at, dateLocale]);

  return (
    <View style={styles.root} accessibilityRole="alert">
      <MaterialIcons name="info-outline" size={22} color={theme.colors.dangerSolid} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t("missions.detail.outcome.rejected.title")}</Text>
        <Text style={styles.subtitle}>{t("missions.detail.outcome.rejected.subtitle")}</Text>
        {formattedDate ? (
          <Text style={styles.date}>
            {t("missions.detail.outcome.rejected.dateLabel", { date: formattedDate })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceSoft,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.cardBody,
    color: theme.colors.text,
    fontWeight: "700",
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textMutedAccent,
    marginTop: theme.spacing.xs,
  },
});
