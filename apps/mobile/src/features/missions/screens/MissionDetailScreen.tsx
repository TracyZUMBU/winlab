import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { formatAbsoluteDateFr } from "@/src/lib/date/format";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";
import { useTranslation } from "react-i18next";
import { useGetMissionByIdQuery } from "../hooks/useGetMissionByIdQuery";
import { useSubmitMissionCompletionMutation } from "../hooks/useSubmitMissionCompletionMutation";

export function MissionDetailScreen() {
  const { t, i18n } = useTranslation();
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const {
    data: mission,
    isLoading,
    isError,
    refetch,
  } = useGetMissionByIdQuery(missionId);

  const { mutateAsync, isPending } = useSubmitMissionCompletionMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const onSubmitMission = async () => {
    if (!missionId) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await mutateAsync({ missionId });

    if (result.success) {
      setSubmitSuccess(t("missions.screen.submitMission"));
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

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      </Screen>
    );
  }

  if (isError || !mission) {
    return (
      <Screen>
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

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{mission.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{mission.mission_type}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.tokenReward}>{mission.token_reward} tokens</Text>
        </View>
        {mission.starts_at ? (
          <Text style={styles.muted}>
            Début : {formatAbsoluteDateFr(mission.starts_at)}
          </Text>
        ) : null}
        {mission.ends_at ? (
          <Text style={styles.muted}>
            Fin : {formatAbsoluteDateFr(mission.ends_at)}
          </Text>
        ) : null}
        {mission.description ? (
          <Text style={styles.description}>{mission.description}</Text>
        ) : null}

        <Button
          title={isPending ? "Soumission..." : "Soumettre"}
          onPress={onSubmitMission}
          disabled={isPending}
          style={styles.submitButton}
        />

        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}
        {submitSuccess ? (
          <Text style={styles.submitSuccess}>{submitSuccess}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  tokenReward: {
    fontSize: 14,
    color: theme.colors.accentSolid,
    fontWeight: "600",
  },
  muted: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    marginTop: theme.spacing.md,
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
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  submitError: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
    textAlign: "center",
  },
  submitSuccess: {
    marginTop: theme.spacing.sm,
    color: theme.colors.success,
    textAlign: "center",
  },
});
