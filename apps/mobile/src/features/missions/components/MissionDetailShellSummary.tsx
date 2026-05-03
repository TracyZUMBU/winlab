import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme";
import type { MissionRow } from "../services/getMissionById";
import {
  getMissionDurationEstimateFromMetadata,
  getMissionDurationHintI18nKey,
  getMissionTypeLabelI18nKey,
} from "../utils/missionDetailPresentation";
import { getMissionThumbnailFallbackUri } from "../utils/missionThumbnailFallback";

type Props = {
  mission: MissionRow;
};

export function MissionDetailShellSummary({ mission }: Props) {
  const { t } = useTranslation();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [mission.id, mission.brand.logo_url]);

  const brandName = mission.brand.name ?? mission.title ?? "";
  const missionTypeLabelKey = getMissionTypeLabelI18nKey(mission.mission_type);

  const missionLogoUri = mission.brand.logo_url?.trim() || null;
  const missionLogoFallbackUri = useMemo(
    () => getMissionThumbnailFallbackUri(mission.id, mission.mission_type),
    [mission.id, mission.mission_type],
  );

  const logoSourceUri = useMemo(() => {
    if (logoFailed) return missionLogoFallbackUri;
    return missionLogoUri ?? missionLogoFallbackUri;
  }, [logoFailed, missionLogoFallbackUri, missionLogoUri]);

  const estimatedDurationLabel = useMemo(() => {
    const durationEstimate = getMissionDurationEstimateFromMetadata(mission.metadata);
    if (durationEstimate?.kind === "minutes") {
      return t("missions.detail.duration.minutes", {
        minutes: durationEstimate.minutes,
      });
    }
    if (durationEstimate?.kind === "seconds") {
      return t("missions.detail.duration.seconds", {
        seconds: durationEstimate.seconds,
      });
    }

    const hintKey = getMissionDurationHintI18nKey(mission.mission_type);
    return hintKey ? t(hintKey) : null;
  }, [mission.metadata, mission.mission_type, t]);

  const brandLogoLabel = t("missions.card.a11y.missionIllustration", {
    brand: brandName || t("app.name"),
  });

  return (
    <>
      <View style={styles.hero} pointerEvents="none">
        {mission.image_url ? (
          <Image
            source={{ uri: mission.image_url }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityLabel={t("missions.detail.hero.image", {
              brand: brandName,
            })}
          />
        ) : (
          <LinearGradient
            colors={[
              theme.colors.accentWash,
              theme.colors.surfaceSoft,
              theme.colors.backgroundDark,
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </View>

      <View style={styles.brandBlock}>
        <View style={styles.brandLogoOuter}>
          {logoSourceUri ? (
            <Image
              source={{ uri: logoSourceUri }}
              style={styles.brandLogoInner}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setLogoFailed(true)}
              accessibilityLabel={brandLogoLabel}
            />
          ) : (
            <View style={styles.brandLogoInner}>
              <MaterialIcons
                name="account-balance"
                size={28}
                color={theme.colors.onAccent}
              />
            </View>
          )}
        </View>

        <Text style={styles.brandName} numberOfLines={1}>
          {brandName}
        </Text>
        {missionTypeLabelKey ? (
          <Text style={styles.typeLabel}>{t(missionTypeLabelKey)}</Text>
        ) : null}
      </View>

      <View style={styles.metaCardsRow}>
        <Card
          variant="outlined"
          style={StyleSheet.flatten([styles.metaCard, styles.metaCardSurface])}
        >
          <MaterialIcons
            name="redeem"
            size={30}
            color={theme.colors.accentSolid}
          />
          <Text style={styles.metaCardLabel}>{t("missions.detail.meta.tokenRewardTitle")}</Text>
          <Text style={styles.metaCardValue}>
            {t("missions.detail.meta.tokenReward", {
              count: mission.token_reward,
            })}
          </Text>
        </Card>

        <Card
          variant="outlined"
          style={StyleSheet.flatten([styles.metaCard, styles.metaCardSurface])}
        >
          <MaterialIcons
            name="schedule"
            size={30}
            color={theme.colors.textMutedAccent}
          />
          <Text style={styles.metaCardLabel}>
            {t("missions.detail.meta.estimatedTimeTitle")}
          </Text>
          <Text style={styles.metaCardValue}>
            {estimatedDurationLabel ?? t("missions.detail.duration.unknown")}
          </Text>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 192,
    backgroundColor: theme.colors.surfaceSoft,
    overflow: "hidden",
    marginHorizontal: -theme.spacing.screenHorizontal,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  brandBlock: {
    marginTop: -theme.spacing.xl / 2,
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.screenHorizontal,
  },
  brandLogoOuter: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoInner: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  typeLabel: {
    ...theme.typography.overline,
    color: theme.colors.accentSolid,
    textAlign: "center",
  },
  metaCardsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  metaCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  metaCardSurface: {
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.borderSubtle,
  },
  metaCardLabel: {
    ...theme.typography.overline,
    color: theme.colors.textMutedAccent,
    textAlign: "center",
    textTransform: "uppercase",
  },
  metaCardValue: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
});
