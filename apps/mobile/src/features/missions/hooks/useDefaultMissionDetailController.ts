import type { TFunction, i18n as I18nInstance } from "i18next";

import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { showSuccessToast } from "@/src/shared/toast";
import type {
  SubmitMissionCompletionParams,
  SubmitMissionCompletionResult,
} from "../services/missionService";
import type { MissionDetailTypeController } from "../screens/detail-types/types";

type Params = {
  missionId: string | undefined;
  isPending: boolean;
  mutateAsync: (
    payload: SubmitMissionCompletionParams,
  ) => Promise<SubmitMissionCompletionResult>;
  refetch: () => Promise<unknown>;
  setSubmitError: (value: string | null) => void;
  t: TFunction;
  i18n: I18nInstance;
};

export function useDefaultMissionDetailController({
  missionId,
  isPending,
  mutateAsync,
  refetch,
  setSubmitError,
  t,
  i18n,
}: Params): MissionDetailTypeController {
  const onPress = async () => {
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

  return {
    primary: {
      title: isPending
        ? t("missions.detail.cta.launchPending")
        : t("missions.detail.cta.launch"),
      iconName: "play-arrow",
      disabled: isPending,
      onPress,
    },
    secondary: null,
  };
}
