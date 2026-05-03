import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/ui/AppHeader";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";
import { useTranslation } from "react-i18next";
import { MissionDetailReadonlyOutcome } from "../components/MissionDetailReadonlyOutcome";
import { MissionDetailRejectionBanner } from "../components/MissionDetailRejectionBanner";
import { MissionDetailShellSummary } from "../components/MissionDetailShellSummary";
import { useDefaultMissionDetailController } from "../hooks/useDefaultMissionDetailController";
import { useGetMissionByIdQuery } from "../hooks/useGetMissionByIdQuery";
import { useMissionDetailExternalAction } from "../hooks/useMissionDetailExternalAction";
import { useMissionDetailVideo } from "../hooks/useMissionDetailVideo";
import { useSubmitMissionCompletionMutation } from "../hooks/useSubmitMissionCompletionMutation";
import { useSurveyMissionDetailController } from "../hooks/useSurveyMissionDetailController";
import { useSurveyMissionForm } from "../survey/useSurveyMissionForm";
import {
  isMissionDetailReadonlyOutcome,
  resolveMissionDetailInteractionState,
} from "../utils/missionDetailInteractionState";
import type { MissionDetailTypeController } from "./detail-types/types";
import { getMissionDetailTypeRuntime } from "./detail-types/missionDetailTypeRuntimeRegistry";

const READONLY_MISSION_DETAIL_CONTROLLER: MissionDetailTypeController = {
  hideBottomPrimary: true,
  primary: {
    title: "",
    iconName: "check",
    disabled: true,
    onPress: async () => {},
  },
  secondary: null,
};

export function MissionDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const {
    data: mission,
    isLoading,
    isError,
    refetch,
  } = useGetMissionByIdQuery(missionId);

  const { mutateAsync, isPending } = useSubmitMissionCompletionMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    surveyDefinition,
    answers: surveyAnswers,
    currentQuestion: currentSurveyQuestion,
    isCompleted: isSurveyCompleted,
    pendingAnswer,
    setPendingAnswer,
    commitCurrentAnswer,
    back: backSurveyQuestion,
  } = useSurveyMissionForm(
    mission?.mission_type === "survey" ? mission.metadata : null,
  );

  useEffect(() => {
    setSubmitError(null);
  }, [missionId]);

  const defaultController = useDefaultMissionDetailController({
    missionId,
    isPending,
    mutateAsync,
    refetch,
    setSubmitError,
    t,
    i18n,
  });
  const surveyController = useSurveyMissionDetailController({
    missionId,
    isPending,
    surveyDefinition,
    surveyAnswers,
    currentSurveyQuestion,
    isSurveyCompleted,
    commitCurrentAnswer,
    backSurveyQuestion,
    mutateAsync,
    refetch,
    setSubmitError,
    t,
    i18n,
    router,
  });

  const interaction = useMemo(
    () =>
      resolveMissionDetailInteractionState(mission?.mission_completions ?? []),
    [mission?.mission_completions],
  );
  const isDetailReadonly = isMissionDetailReadonlyOutcome(interaction);

  const { videoDetailSlot, videoController } = useMissionDetailVideo(mission, {
    disableVideoFlow: isDetailReadonly,
  });
  const { externalActionSlot, externalActionController } =
    useMissionDetailExternalAction(mission);

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

  const runtime = getMissionDetailTypeRuntime(mission.mission_type);
  const TypeDetailRenderer = runtime.Renderer;
  const typeRendererProps = runtime.buildRendererProps({
    mission,
    survey: {
      hasValidSurvey: Boolean(surveyDefinition),
      answers: surveyAnswers,
      currentQuestion: currentSurveyQuestion,
      pendingAnswer,
      setPendingAnswer,
    },
    video: videoDetailSlot,
    externalAction: externalActionSlot,
  });
  const activeController = isDetailReadonly
    ? READONLY_MISSION_DETAIL_CONTROLLER
    : runtime.selectController({
        defaultController,
        surveyController,
        videoController,
        externalActionController,
      });

  const hideBottomPrimary = Boolean(activeController.hideBottomPrimary);
  const scrollBottomPadding =
    theme.spacing.lg +
    (hideBottomPrimary
      ? Math.max(insets.bottom, theme.spacing.md)
      : theme.spacing.sm);

  return (
    <Screen>
      {shellHeader}

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: scrollBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <MissionDetailShellSummary mission={mission} />

          {interaction.kind === "active_after_rejection" ? (
            <MissionDetailRejectionBanner
              completion={interaction.latestCompletion}
            />
          ) : null}

          {interaction.kind === "readonly_approved" ||
          interaction.kind === "readonly_pending" ? (
            <MissionDetailReadonlyOutcome
              variant={
                interaction.kind === "readonly_approved" ? "approved" : "pending"
              }
              completion={interaction.latestCompletion}
            />
          ) : (
            <Suspense
              fallback={
                <View style={styles.detailSuspenseFallback}>
                  <ActivityIndicator size="small" color={theme.colors.accentSolid} />
                </View>
              }
            >
              <TypeDetailRenderer {...typeRendererProps} />
            </Suspense>
          )}

          {!isDetailReadonly && submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}
        </ScrollView>

        {!hideBottomPrimary ? (
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
                title={activeController.primary.title}
                onPress={() => void activeController.primary.onPress()}
                disabled={activeController.primary.disabled}
                fullWidth
                rightIcon={
                  <MaterialIcons
                    name={activeController.primary.iconName}
                    size={18}
                    color={theme.colors.onAccent}
                  />
                }
              />
              {activeController.secondary ? (
                <Pressable
                  style={styles.surveyBackButton}
                  onPress={activeController.secondary.onPress}
                  disabled={activeController.secondary.disabled}
                >
                  <Text style={styles.surveyBackButtonText}>
                    {activeController.secondary.title}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
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
  },
  detailSuspenseFallback: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },

  submitError: {
    marginTop: theme.spacing.lg,
    color: theme.colors.dangerSolid,
    textAlign: "center",
    paddingHorizontal: theme.spacing.md,
  },
  bottomBar: {
    width: "100%",
  },
  bottomBarInner: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  surveyBackButton: {
    minHeight: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  surveyBackButtonText: {
    ...theme.typography.cardBody,
    color: theme.colors.text,
    fontWeight: "600",
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
