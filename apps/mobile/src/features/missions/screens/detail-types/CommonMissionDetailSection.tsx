import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { theme } from "@/src/theme";
import type { MissionRow } from "../../services/getMissionById";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  mission: MissionRow;
};

export function CommonMissionDetailSection({ mission }: Props) {
  const { t } = useTranslation();

  const validationFeature = mission.validation_mode === "automatic"
    ? {
        title: t("missions.detail.features.validationInstant.title"),
        description: t("missions.detail.features.validationInstant.description"),
        iconName: "check-circle" as MaterialIconName,
      }
    : {
        title: t("missions.detail.features.validationManual.title"),
        description: t("missions.detail.features.validationManual.description"),
        iconName: "schedule" as MaterialIconName,
      };

  return (
    <View style={styles.aboutSection}>
      <SectionHeader title={t("missions.detail.about.title")} />
      {mission.description ? (
        <Text style={styles.aboutDescription}>{mission.description}</Text>
      ) : (
        <Text style={styles.aboutDescription}>
          {t("missions.detail.about.descriptionFallback")}
        </Text>
      )}

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <MaterialIcons
            name="check-circle"
            size={22}
            color={theme.colors.accentSolid}
          />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>
              {t("missions.detail.features.anonymous.title")}
            </Text>
            <Text style={styles.featureDescription}>
              {t("missions.detail.features.anonymous.description")}
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <MaterialIcons
            name={validationFeature.iconName}
            size={22}
            color={theme.colors.accentSolid}
          />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{validationFeature.title}</Text>
            <Text style={styles.featureDescription}>
              {validationFeature.description}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  aboutDescription: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    lineHeight: 22,
  },
  features: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "flex-start",
  },
  featureText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  featureTitle: {
    ...theme.typography.cardTitle,
  },
  featureDescription: {
    ...theme.typography.cardBody,
    color: theme.colors.textMuted,
  },
});
