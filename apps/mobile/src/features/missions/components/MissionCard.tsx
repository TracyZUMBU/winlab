import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Badge, type BadgeTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import type { Enums } from "@/src/lib/supabase.types";
import { theme } from "@/src/theme";

import type { AvailableMission } from "../hooks/useTodoMissionsQuery";
import { getMissionThumbnailFallbackUri } from "../utils/missionThumbnailFallback";

const DESCRIPTION_MAX_LENGTH = 80;

function truncateDescription(description: string | null): string {
  if (!description) return "";
  if (description.length <= DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, DESCRIPTION_MAX_LENGTH).trim()}…`;
}

function userStatusToBadgeTone(
  status: AvailableMission["userStatus"],
): BadgeTone {
  switch (status) {
    case "available":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "accent";
    case "completed":
      return "neutral";
  }
}

function ctaTitleKey(
  status: AvailableMission["userStatus"],
):
  | "missions.card.cta.start"
  | "missions.card.cta.pending"
  | "missions.card.cta.completed"
  | "missions.card.cta.rejected" {
  switch (status) {
    case "pending":
      return "missions.card.cta.pending";
    case "completed":
      return "missions.card.cta.completed";
    case "rejected":
      return "missions.card.cta.rejected";
    default:
      return "missions.card.cta.start";
  }
}

function resolveCtaVariant(
  status: AvailableMission["userStatus"],
  missionType: Enums<"mission_type">,
): "primary" | "soft" {
  if (status === "completed" || status === "pending" || status === "rejected")
    return "soft";
  return "primary";
}

function durationHintI18nKey(
  missionType: Enums<"mission_type">,
):
  | "missions.durationHint.survey"
  | "missions.durationHint.video"
  | "missions.durationHint.follow"
  | "missions.durationHint.external_action"
  | null {
  switch (missionType) {
    case "survey":
      return "missions.durationHint.survey";
    case "video":
      return "missions.durationHint.video";
    case "follow":
      return "missions.durationHint.follow";
    case "external_action":
      return "missions.durationHint.external_action";
    default:
      return null;
  }
}

function ctaRightIcon(
  missionType: Enums<"mission_type">,
  variant: "primary" | "soft" | "ghost",
): ReactNode {
  if (variant === "ghost") return null;

  const color =
    variant === "primary" ? theme.colors.onAccent : theme.colors.text;
  const size = 20;

  return <MaterialIcons name="arrow-forward" size={size} color={color} />;
}

export type MissionCardProps = {
  mission: AvailableMission;
  onPress: (mission: AvailableMission) => void;
  /** Optional server-driven duration label; overrides type-based hint when set. */
  durationLabel?: string;
  /** List maquette hides status; set true for management views. */
  showStatusBadge?: boolean;
};

export function MissionCard({
  mission,
  onPress,
  durationLabel,
  showStatusBadge = false,
}: MissionCardProps) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const brandName = mission.brand?.name ?? "—";
  const logoUri = mission.image_url?.trim() || null;
  const thumbnailUri =
    logoUri ?? getMissionThumbnailFallbackUri(mission.id, mission.mission_type);

  useEffect(() => {
    setImageFailed(false);
  }, [mission.id, logoUri, mission.mission_type]);
  const description = truncateDescription(mission.description);
  const statusTone = userStatusToBadgeTone(mission.userStatus);
  const buttonVariant = resolveCtaVariant(
    mission.userStatus,
    mission.mission_type,
  );
  const hintKey = durationHintI18nKey(mission.mission_type);
  const hintText = hintKey ? t(hintKey) : "";
  const durationForMeta =
    durationLabel?.trim() ||
    (hintText.trim().length > 0 ? hintText : undefined);

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumbnailWrap}>
          {imageFailed ? (
            <View
              style={[styles.thumbnail, styles.thumbnailPlaceholder]}
              accessibilityLabel={t("missions.card.a11y.missionIllustration", {
                brand: brandName,
              })}
            />
          ) : (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              accessibilityLabel={
                logoUri
                  ? t("missions.card.a11y.brandLogo", { brand: brandName })
                  : t("missions.card.a11y.missionIllustration", {
                      brand: brandName,
                    })
              }
              onError={() => setImageFailed(true)}
            />
          )}
          {mission.mission_type === "video" ? (
            <View style={styles.playOverlay} pointerEvents="none">
              <MaterialIcons
                name="play-circle-filled"
                size={36}
                color={theme.colors.onAccent}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.metaTokenReward}>
              {t("missions.card.tokenReward", { count: mission.token_reward })}
            </Text>
            {durationForMeta ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.duration}>{durationForMeta}</Text>
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
          {showStatusBadge ? (
            <View style={styles.statusRow}>
              <Badge tone={statusTone}>
                {t(`missions.card.status.${mission.userStatus}`)}
              </Badge>
            </View>
          ) : null}
        </View>
      </View>
      <Button
        variant={buttonVariant}
        title={t(ctaTitleKey(mission.userStatus))}
        onPress={() => onPress(mission)}
        fullWidth
        rightIcon={ctaRightIcon(mission.mission_type, buttonVariant)}
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
  thumbnailWrap: {
    position: "relative",
    width: theme.layout.missionThumbnailSize,
    height: theme.layout.missionThumbnailSize,
  },
  thumbnail: {
    width: theme.layout.missionThumbnailSize,
    height: theme.layout.missionThumbnailSize,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceSoft,
  },
  thumbnailPlaceholder: {
    backgroundColor: theme.colors.surfaceSoft,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
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
    color: theme.colors.textMutedAccent,
    fontSize: 12,
    opacity: 0.55,
  },
  metaTokenReward: {
    color: theme.colors.accentSolid,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
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
    color: theme.colors.textMutedAccent,
    ...theme.typography.cardBody,
  },
  statusRow: {
    marginTop: theme.spacing.xs,
  },
});
