import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppHeader } from "@/src/components/ui/AppHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";
import { showSuccessToast } from "@/src/shared/toast";
import { useTranslation } from "react-i18next";
import { useGetMissionByIdQuery } from "../hooks/useGetMissionByIdQuery";
import { useSubmitMissionCompletionMutation } from "../hooks/useSubmitMissionCompletionMutation";
import {
  getMissionDurationEstimateFromMetadata,
  getMissionDurationHintI18nKey,
  getMissionTypeLabelI18nKey,
} from "../utils/missionDetailPresentation";
import { getMissionThumbnailFallbackUri } from "../utils/missionThumbnailFallback";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export function MissionDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const {
    data: mission,
    isLoading,
    isError,
    refetch,
  } = useGetMissionByIdQuery(missionId);

  const { mutateAsync, isPending } = useSubmitMissionCompletionMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [missionId, mission?.brand?.logo_url]);

  const onSubmitMission = async () => {
    if (!missionId) return;

    setSubmitError(null);

    const result = await mutateAsync({ missionId });

    if (result.success) {
      showSuccessToast({ title: t("missions.screen.submitMission") });
      await refetch();
      return;
    }

    if (result.kind === "business") {
      setSubmitError(
        getI18nMessageForCode({
          t,
          i18n,
          baseKey: "missions.submission.errors",
          code: result.errorCode,
          fallbackKey: "missions.submission.errors.generic",
        }),
      );
      return;
    }

    setSubmitError(t("missions.submission.errors.generic"));
  };

  const brandName = mission?.brand?.name ?? mission?.title ?? "";
  const missionTypeLabelKey = mission
    ? getMissionTypeLabelI18nKey(mission.mission_type)
    : null;

  const missionLogoUri = mission?.brand?.logo_url?.trim() || null;
  const missionLogoFallbackUri = useMemo(() => {
    if (!mission) return null;
    return getMissionThumbnailFallbackUri(mission.id, mission.mission_type);
  }, [mission]);

  const logoSourceUri = useMemo(() => {
    if (!mission) return null;
    if (logoFailed) return missionLogoFallbackUri;
    return missionLogoUri ?? missionLogoFallbackUri;
  }, [logoFailed, mission, missionLogoFallbackUri, missionLogoUri]);

  const estimatedDurationLabel = useMemo(() => {
    if (!mission) return null;

    const durationEstimate = getMissionDurationEstimateFromMetadata(
      mission.metadata,
    );
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
  }, [mission, t]);

  const validationFeature = useMemo(() => {
    if (!mission) return null;

    if (mission.validation_mode === "automatic") {
      return {
        title: t("missions.detail.features.validationInstant.title"),
        description: t(
          "missions.detail.features.validationInstant.description",
        ),
        iconName: "check-circle" as MaterialIconName,
      };
    }

    return {
      title: t("missions.detail.features.validationManual.title"),
      description: t("missions.detail.features.validationManual.description"),
      iconName: "schedule" as MaterialIconName,
    };
  }, [mission, t]);

  const shellHeader = (
    <AppHeader
      title={t("missions.layout.detail")}
      leftSlot={
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          style={styles.headerIconButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={theme.colors.text}
          />
        </Pressable>
      }
      showBottomBorder
    />
  );

  const progressPercent = 0;
  const progressBarWidthPercent = progressPercent === 0 ? 5 : progressPercent;

  if (isLoading) {
    return (
      <Screen>
        {shellHeader}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.muted}>
            {t("missions.detail.screen.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  if (isError || !mission) {
    return (
      <Screen>
        {shellHeader}
        <View style={styles.centered}>
          <Text style={styles.error}>
            {missionId
              ? t("missions.screen.unfoundMission")
              : t("missions.screen.unspecifiedMission")}
          </Text>
          {isError ? (
            <Text style={styles.muted}>{userFacingQueryLoadHint(t)}</Text>
          ) : null}
          {missionId ? (
            <Pressable style={styles.retry} onPress={() => void refetch()}>
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    );
  }

  const anonymousFeature: {
    title: string;
    description: string;
    iconName: MaterialIconName;
  } = {
    title: t("missions.detail.features.anonymous.title"),
    description: t("missions.detail.features.anonymous.description"),
    iconName: "check-circle" as MaterialIconName,
  };

  const brandLogoLabel = t("missions.card.a11y.missionIllustration", {
    brand: brandName || t("app.name"),
  });

  return (
    <Screen>
      {shellHeader}

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero} pointerEvents="none">
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

          <View style={styles.progressSection}>
            <View style={styles.progressTopRow}>
              <Text style={styles.progressTitle}>
                {t("missions.detail.progress.title")}
              </Text>
              <Text style={styles.progressPercent}>
                {t("missions.detail.progress.percent", {
                  percent: progressPercent,
                })}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressBarWidthPercent}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.metaCardsRow}>
            <Card
              variant="outlined"
              style={StyleSheet.flatten([
                styles.metaCard,
                styles.metaCardSurface,
              ])}
            >
              <MaterialIcons
                name="redeem"
                size={30}
                color={theme.colors.accentSolid}
              />
              <Text style={styles.metaCardLabel}>
                {t("missions.detail.meta.tokenRewardTitle")}
              </Text>
              <Text style={styles.metaCardValue}>
                {t("missions.detail.meta.tokenReward", {
                  count: mission.token_reward,
                })}
              </Text>
            </Card>

            <Card
              variant="outlined"
              style={StyleSheet.flatten([
                styles.metaCard,
                styles.metaCardSurface,
              ])}
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
                {estimatedDurationLabel ??
                  t("missions.detail.duration.unknown")}
              </Text>
            </Card>
          </View>

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
                  name={anonymousFeature.iconName}
                  size={22}
                  color={theme.colors.accentSolid}
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>
                    {anonymousFeature.title}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {anonymousFeature.description}
                  </Text>
                </View>
              </View>

              {validationFeature ? (
                <View style={styles.featureRow}>
                  <MaterialIcons
                    name={validationFeature.iconName}
                    size={22}
                    color={theme.colors.accentSolid}
                  />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>
                      {validationFeature.title}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {validationFeature.description}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar} pointerEvents="box-none">
          <LinearGradient
            colors={["transparent", theme.colors.surface, theme.colors.surface]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View
            style={[styles.bottomBarInner, { paddingBottom: theme.spacing.sm }]}
          >
            <Button
              title={
                isPending
                  ? t("missions.detail.cta.launchPending")
                  : t("missions.detail.cta.launch")
              }
              onPress={onSubmitMission}
              disabled={isPending}
              fullWidth
              rightIcon={
                <MaterialIcons
                  name="play-arrow"
                  size={18}
                  color={theme.colors.onAccent}
                />
              }
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingBottom: theme.spacing.lg,
  },

  hero: {
    height: 192,
    backgroundColor: theme.colors.surfaceSoft,
    overflow: "hidden",
    marginHorizontal: -theme.spacing.screenHorizontal,
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

  progressSection: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  progressTitle: {
    ...theme.typography.cardBody,
    color: theme.colors.text,
    fontWeight: "700",
  },
  progressPercent: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accentSolid,
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

  submitError: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text,
    textAlign: "center",
    paddingHorizontal: theme.spacing.md,
  },

  bottomBar: {
    width: "100%",
  },
  bottomBarInner: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
  },

  headerIconButton: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  muted: {
    fontSize: 13,
    color: theme.colors.textMutedAccent,
    marginTop: theme.spacing.sm,
  },
  error: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
  },
  retry: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.sm,
  },
  retryText: {
    color: theme.colors.onAccent,
    fontWeight: "600",
  },
});
