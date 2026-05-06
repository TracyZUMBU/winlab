import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { theme } from "@/src/theme";
import { MissionRulesMarkdownModal } from "../../components/MissionRulesMarkdownModal";
import type { MissionRow } from "../../services/getMissionById";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  mission: MissionRow;
};

export function CommonMissionDetailSection({ mission }: Props) {
  const { t } = useTranslation();
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const hasRules = (mission.rules_text ?? "").trim().length > 0;

  const validationFeature =
    mission.validation_mode === "automatic"
      ? {
          title: t("missions.detail.features.validationInstant.title"),
          description: t(
            "missions.detail.features.validationInstant.description",
          ),
          iconName: "check-circle" as MaterialIconName,
        }
      : {
          title: t("missions.detail.features.validationManual.title"),
          description: t(
            "missions.detail.features.validationManual.description",
          ),
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

      {hasRules ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("missions.detail.rulesLinkA11y")}
          onPress={() => setRulesModalOpen(true)}
          style={({ pressed }) => [
            styles.rulesLinkWrap,
            pressed && styles.rulesLinkPressed,
          ]}
        >
          <Text style={styles.rulesLink}>{t("missions.detail.rulesLink")}</Text>
        </Pressable>
      ) : null}

      {rulesModalOpen ? (
        <MissionRulesMarkdownModal
          markdown={mission.rules_text}
          onClose={() => setRulesModalOpen(false)}
        />
      ) : null}

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
  rulesLinkWrap: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
  },
  rulesLinkPressed: {
    opacity: 0.75,
  },
  rulesLink: {
    ...theme.typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.accentSolid,
    textDecorationLine: "underline",
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
