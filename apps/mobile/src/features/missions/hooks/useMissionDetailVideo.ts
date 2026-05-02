import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type {
  MissionDetailTypeController,
  MissionVideoDetailSlotProps,
} from "../screens/detail-types/types";
import type { MissionRow } from "../services/getMissionById";
import { parseVideoMissionMetadata } from "../utils/videoMissionMetadata";
import { useVideoMissionDetailController } from "./useVideoMissionDetailController";
import { useWatchVideoMission } from "./useWatchVideoMission";

export type UseMissionDetailVideoResult = {
  videoDetailSlot: MissionVideoDetailSlotProps | null;
  videoController: MissionDetailTypeController;
};

/**
 * État et actions mission vidéo sur l’écran détail (même rôle que le duo
 * `useSurveyMissionForm` + `useSurveyMissionDetailController` pour le sondage).
 */
export function useMissionDetailVideo(
  mission: MissionRow | undefined,
): UseMissionDetailVideoResult {
  const { t } = useTranslation();

  const videoMetaParsed = useMemo(
    () =>
      mission?.mission_type === "video"
        ? parseVideoMissionMetadata(mission.metadata)
        : null,
    [mission],
  );

  const videoMissionEnabled = Boolean(
    mission && mission.mission_type === "video" && videoMetaParsed,
  );

  const videoWatch = useWatchVideoMission({
    enabled: videoMissionEnabled,
    missionId: mission?.id ?? "",
    tokenReward: mission?.token_reward ?? 0,
    initialCompleted: false,
    metadata: videoMetaParsed ?? {
      video_url: "",
      title: "",
    },
  });

  const {
    handleVideoComplete,
    isCompleted: isVideoMissionCompleted,
    canSubmit: canSubmitVideoMission,
    isSubmitting: isVideoMissionSubmitting,
    handleValidatePress,
  } = videoWatch;

  const videoDetailSlot = useMemo((): MissionVideoDetailSlotProps | null => {
    if (!mission || mission.mission_type !== "video") return null;
    if (!videoMetaParsed) return null;
    return {
      videoUrl: videoMetaParsed.video_url,
      displayTitle: videoMetaParsed.title || mission.title,
      thumbnailUrl: videoMetaParsed.thumbnail_url ?? null,
      onVideoComplete: handleVideoComplete,
      isCompleted: isVideoMissionCompleted,
    };
  }, [
    mission,
    videoMetaParsed,
    handleVideoComplete,
    isVideoMissionCompleted,
  ]);

  const videoController = useVideoMissionDetailController({
    isCompleted:
      mission?.mission_type === "video" ? isVideoMissionCompleted : false,
    canSubmit:
      mission?.mission_type === "video" ? canSubmitVideoMission : false,
    isSubmitting:
      mission?.mission_type === "video" ? isVideoMissionSubmitting : false,
    handleValidatePress,
    t,
  });

  return { videoDetailSlot, videoController };
}
