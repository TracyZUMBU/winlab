import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { homeDashboardKeys } from "@/src/features/home/queries/homeDashboardKeys";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { queryClient } from "@/src/lib/query/queryClient";
import { logger } from "@/src/lib/logger";
import { showErrorToast, showSuccessToast } from "@/src/shared/toast";

import { missionKeys } from "../queries/missionKeys";
import { missionListKeys } from "../queries/missionListKeys";
import { submitMissionCompletion } from "../services/missionService";

export type UseWatchVideoMissionParams = {
  /** Quand `false`, aucune soumission ni progression (mission non chargée ou autre type). */
  enabled?: boolean;
  missionId: string;
  /** Récompense affichée dans le toast de succès (+X jetons). */
  tokenReward: number;
  /** Si la mission est déjà complétée côté serveur (liste / détail). */
  initialCompleted?: boolean;
  metadata: {
    video_url: string;
    title: string;
    thumbnail_url?: string;
  };
};

export type UseWatchVideoMissionResult = {
  isCompleted: boolean;
  isSubmitting: boolean;
  handleVideoComplete: () => void;
  canSubmit: boolean;
  /** Appeler au tap sur « Valider » après lecture complète. */
  handleValidatePress: () => Promise<void>;
};

function invalidateMissionCaches(missionId: string, userId: string | null) {
  void queryClient.invalidateQueries({ queryKey: [...missionListKeys.all] });
  void queryClient.invalidateQueries({
    queryKey: [...missionKeys.all, "detail", missionId],
  });

  if (!userId) return;

  void queryClient.invalidateQueries({
    queryKey: ["wallet", "balance", userId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["wallet", "pendingRewards", userId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["wallet", "transactions", userId],
  });
  void queryClient.invalidateQueries({
    queryKey: homeDashboardKeys.detail(userId),
  });
}

export function useWatchVideoMission({
  enabled = true,
  missionId,
  tokenReward,
  initialCompleted = false,
  metadata,
}: UseWatchVideoMissionParams): UseWatchVideoMissionResult {
  const { t, i18n } = useTranslation();
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;

  useEffect(() => {
    if (!enabled) {
      setIsCompleted(false);
      setCanSubmit(false);
      isCompletedRef.current = false;
      return;
    }
    setIsCompleted(initialCompleted);
    setCanSubmit(false);
    isCompletedRef.current = initialCompleted;
  }, [enabled, missionId, initialCompleted, metadata.video_url]);

  const handleVideoComplete = useCallback(() => {
    if (!enabled || isCompletedRef.current) return;
    setCanSubmit(true);
  }, [enabled]);

  const handleValidatePress = useCallback(async () => {
    if (
      !enabled ||
      !missionId ||
      !canSubmit ||
      isSubmitting ||
      isCompletedRef.current
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitMissionCompletion({
        missionId,
        proofData: { watched_until_end: true },
      });

      if (result.success) {
        invalidateMissionCaches(missionId, userId);
        setIsCompleted(true);
        setCanSubmit(false);
        showSuccessToast({
          title: t("missions.detail.video.completeSuccessToast", {
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
      logger.warn("[missions] watch_video validate failed", { missionId, error });
      showErrorToast({
        title: t("missions.submission.errors.generic"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    enabled,
    canSubmit,
    isSubmitting,
    missionId,
    userId,
    t,
    i18n,
    tokenReward,
  ]);

  return {
    isCompleted,
    isSubmitting,
    handleVideoComplete,
    canSubmit,
    handleValidatePress,
  };
}
