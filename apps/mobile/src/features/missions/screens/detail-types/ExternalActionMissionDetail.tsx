import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { theme } from "@/src/theme";

import { MissionExternalActionButton } from "../../components/MissionExternalActionButton";
import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

export function ExternalActionMissionDetail({
  mission,
  survey: _survey,
  video: _video,
  externalAction,
}: MissionTypeDetailRendererProps) {
  const { t } = useTranslation();

  if (!externalAction) {
    return (
      <>
        <CommonMissionDetailSection mission={mission} />
        <View style={styles.section}>
          <Text style={styles.configError}>
            {t("missions.detail.externalAction.configError")}
          </Text>
        </View>
      </>
    );
  }

  const {
    url,
    label,
    platform,
    hasOpenedLink,
    canSubmit,
    isSubmitting,
    isCompleted,
    secondsRemaining,
    handleLinkOpened,
    handleSubmit,
  } = externalAction;

  const submitTitle = (() => {
    if (isCompleted) {
      return t("missions.detail.externalAction.submitDone");
    }
    if (isSubmitting) {
      return t("missions.detail.externalAction.submitValidating");
    }
    if (hasOpenedLink && secondsRemaining > 0 && !canSubmit) {
      return t("missions.detail.externalAction.submitCountdown", {
        seconds: secondsRemaining,
      });
    }
    return t("missions.detail.externalAction.submitDefault");
  })();

  const submitDisabled =
    isCompleted ||
    isSubmitting ||
    !canSubmit ||
    (!hasOpenedLink && !isCompleted);

  const hintText = (() => {
    if (isCompleted) return null;
    if (isSubmitting) return null;
    if (!hasOpenedLink) {
      return t("missions.detail.externalAction.hintOpenLinkFirst");
    }
    if (hasOpenedLink && !canSubmit && secondsRemaining > 0) {
      return t("missions.detail.externalAction.hintCountdown", {
        seconds: secondsRemaining,
      });
    }
    return null;
  })();

  return (
    <>
      <CommonMissionDetailSection mission={mission} />

      <View style={styles.section}>
        <MissionExternalActionButton
          url={url}
          label={label}
          platform={platform}
          onOpened={handleLinkOpened}
          disabled={isCompleted}
        />

        <Button
          title={submitTitle}
          onPress={() => void handleSubmit()}
          disabled={submitDisabled}
          fullWidth
          variant="primary"
          style={styles.submitButton}
        />
        {hintText ? <Text style={styles.hint}>{hintText}</Text> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
  hint: {
    ...theme.typography.cardBody,
    color: theme.colors.textMutedAccent,
    textAlign: "center",
  },
  configError: {
    ...theme.typography.body,
    color: theme.colors.dangerSolid,
    textAlign: "center",
  },
});
