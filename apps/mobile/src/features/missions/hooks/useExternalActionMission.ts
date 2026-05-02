import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { homeDashboardKeys } from "@/src/features/home/queries/homeDashboardKeys";
import { walletKeys } from "@/src/features/wallet/queries/walletKeys";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { logger } from "@/src/lib/logger";
import { queryClient } from "@/src/lib/query/queryClient";
import { showErrorToast, showSuccessToast } from "@/src/shared/toast";

import { missionKeys } from "../queries/missionKeys";
import { missionListKeys } from "../queries/missionListKeys";
import { submitMissionCompletion } from "../services/missionService";

export type UseExternalActionMissionParams = {
  /** Quand `false`, pas de countdown ni soumission (autre type de mission ou métadonnées absentes). */
  enabled?: boolean;
  missionId: string;
  metadata: {
    external_url: string;
    platform: string;
    action_label: string;
    min_external_duration_seconds?: number;
  };
  tokenReward: number;
  initialServerCompleted?: boolean;
};

export type UseExternalActionMissionResult = {
  hasOpenedLink: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  isCompleted: boolean;
  secondsRemaining: number;
  handleLinkOpened: () => void;
  handleSubmit: () => void;
};

function invalidateMissionCaches(missionId: string, userId: string | null) {
  void queryClient.invalidateQueries({ queryKey: [...missionListKeys.all] });
  void queryClient.invalidateQueries({
    queryKey: missionKeys.detail(missionId),
  });

  if (!userId) return;

  void queryClient.invalidateQueries({
    queryKey: walletKeys.balance(userId),
  });
  void queryClient.invalidateQueries({
    queryKey: walletKeys.pendingRewards(userId),
  });
  void queryClient.invalidateQueries({
    queryKey: walletKeys.transactions(userId),
  });
  void queryClient.invalidateQueries({
    queryKey: homeDashboardKeys.detail(userId),
  });
}

export function useExternalActionMission({
  enabled = true,
  missionId,
  metadata,
  tokenReward,
  initialServerCompleted = false,
}: UseExternalActionMissionParams): UseExternalActionMissionResult {
  const { t, i18n } = useTranslation();
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  const minDuration = metadata.min_external_duration_seconds ?? 5;

  const [isCompleted, setIsCompleted] = useState(initialServerCompleted);
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(minDuration);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  useEffect(() => {
    if (!enabled) {
      setIsCompleted(false);
      setHasOpenedLink(false);
      setCanSubmit(false);
      setSecondsRemaining(minDuration);
      setIsSubmitting(false);
      clearCountdown();
      return;
    }
    setIsCompleted(initialServerCompleted);
    setHasOpenedLink(false);
    setCanSubmit(false);
    setSecondsRemaining(minDuration);
    setIsSubmitting(false);
    clearCountdown();
  }, [
    enabled,
    missionId,
    initialServerCompleted,
    minDuration,
    metadata.external_url,
    clearCountdown,
  ]);

  const handleLinkOpened = useCallback(() => {
    if (!enabled) return;
    if (isCompleted || initialServerCompleted) return;
    if (hasOpenedLink) return;

    setHasOpenedLink(true);
    clearCountdown();

    const duration = Math.max(0, minDuration);
    setSecondsRemaining(duration);

    if (duration <= 0) {
      setCanSubmit(true);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearCountdown();
          setCanSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [
    isCompleted,
    initialServerCompleted,
    hasOpenedLink,
    minDuration,
    clearCountdown,
    enabled,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!enabled) return;
    if (!canSubmit || isSubmitting || isCompleted) return;

    setIsSubmitting(true);
    try {
      const result = await submitMissionCompletion({
        missionId,
        proofData: {
          declared: true,
          platform: metadata.platform,
          opened_link: true,
        },
      });

      if (result.success) {
        invalidateMissionCaches(missionId, userId);
        clearCountdown();
        setIsCompleted(true);
        setCanSubmit(false);
        showSuccessToast({
          title: t("missions.detail.externalAction.successToast", {
            tokenReward,
          }),
        });
        return;
      }

      if (result.kind === "business") {
        showErrorToast({
          title: getI18nMessageForCode({
            t,
            i18n,
            baseKey: "missions.submission.errors",
            code: result.errorCode,
            fallbackKey: "missions.submission.errors.generic",
          }),
        });
        return;
      }

      showErrorToast({
        title: t("missions.submission.errors.generic"),
      });
    } catch (error) {
      logger.warn("[missions] external_action submit failed", {
        missionId,
        error,
      });
      showErrorToast({
        title: t("missions.submission.errors.generic"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    isSubmitting,
    isCompleted,
    missionId,
    metadata.platform,
    userId,
    t,
    i18n,
    tokenReward,
    clearCountdown,
    enabled,
  ]);

  return {
    hasOpenedLink,
    canSubmit,
    isSubmitting,
    isCompleted,
    secondsRemaining,
    handleLinkOpened,
    handleSubmit,
  };
}
