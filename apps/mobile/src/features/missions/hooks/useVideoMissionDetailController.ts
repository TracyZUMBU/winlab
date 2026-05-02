import type { TFunction } from "i18next";

import type { MissionDetailTypeController } from "../screens/detail-types/types";

type Params = {
  isCompleted: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  handleValidatePress: () => Promise<void>;
  t: TFunction;
};

export function useVideoMissionDetailController({
  isCompleted,
  canSubmit,
  isSubmitting,
  handleValidatePress,
  t,
}: Params): MissionDetailTypeController {
  const primary: MissionDetailTypeController["primary"] = isCompleted
    ? {
        title: t("missions.detail.video.completedState"),
        iconName: "check",
        disabled: true,
        onPress: async () => {},
      }
    : canSubmit
      ? {
          title: t("missions.detail.video.validate"),
          iconName: "arrow-forward",
          disabled: isSubmitting,
          onPress: handleValidatePress,
        }
      : {
          title: t("missions.detail.video.watchToEndHint"),
          iconName: "play-arrow",
          disabled: true,
          onPress: async () => {},
        };

  return {
    primary,
    secondary: null,
  };
}
