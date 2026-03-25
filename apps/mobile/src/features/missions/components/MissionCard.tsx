import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";

import { Badge, type BadgeTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";

import type { AvailableMission } from "../hooks/useAvailableMissionsQuery";

const DESCRIPTION_MAX_LENGTH = 80;

function truncateDescription(description: string | null): string {
  if (!description) return "";
  if (description.length <= DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, DESCRIPTION_MAX_LENGTH).trim()}…`;
}

function userStatusToBadgeTone(status: AvailableMission["userStatus"]): BadgeTone {
  switch (status) {
    case "available":
      return "success";
    case "pending":
      return "warning";
    case "completed":
      return "neutral";
  }
}

function userStatusToButtonVariant(
  status: AvailableMission["userStatus"],
): "primary" | "soft" | "ghost" {
  switch (status) {
    case "available":
      return "primary";
    case "pending":
      return "soft";
    case "completed":
      return "ghost";
  }
}

export type MissionCardProps = {
  mission: AvailableMission;
  onPress: (mission: AvailableMission) => void;
  /** Optional label shown next to reward (e.g. estimated time) once available from API. */
  durationLabel?: string;
};

export function MissionCard({
  mission,
  onPress,
  durationLabel,
}: MissionCardProps) {
  const { t } = useTranslation();
  const brandName = mission.brand?.name ?? "—";
  const description = truncateDescription(mission.description);
  const statusTone = userStatusToBadgeTone(mission.userStatus);
  const buttonVariant = userStatusToButtonVariant(mission.userStatus);

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.topRow}>
        {mission.brand?.logo_url ? (
          <Image
            source={{ uri: mission.brand.logo_url }}
            style={styles.thumbnail}
            accessibilityLabel={t("missions.card.a11y.brandLogo", { brand: brandName })}
          />
        ) : (
          <View
            style={[styles.thumbnail, styles.thumbnailPlaceholder]}
            accessibilityLabel={t("missions.card.a11y.brandLogo", { brand: brandName })}
          />
        )}
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Badge tone="accent">
              {t("missions.card.tokenReward", { count: mission.token_reward })}
            </Badge>
            {durationLabel ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.duration}>{durationLabel}</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {mission.title}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
          <View style={styles.statusRow}>
            <Badge tone={statusTone}>
              {t(`missions.card.status.${mission.userStatus}`)}
            </Badge>
          </View>
        </View>
      </View>
      <Button
        variant={buttonVariant}
        title={t("missions.card.cta.start")}
        onPress={() => onPress(mission)}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  thumbnail: {
    width: theme.layout.missionThumbnailSize,
    height: theme.layout.missionThumbnailSize,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  thumbnailPlaceholder: {
    backgroundColor: theme.colors.surfaceSoft,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  metaDot: {
    color: theme.colors.textMuted,
    fontSize: 12,
    opacity: 0.5,
  },
  duration: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.cardTitle,
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.cardBody,
  },
  statusRow: {
    marginTop: theme.spacing.xs,
  },
});
