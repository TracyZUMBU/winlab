import { useMemo } from "react";

import type {
  MissionDetailTypeController,
  MissionExternalActionDetailSlotProps,
} from "../screens/detail-types/types";
import type { MissionRow } from "../services/getMissionById";
import {
  isMissionDetailReadonlyOutcome,
  resolveMissionDetailInteractionState,
} from "../utils/missionDetailInteractionState";
import { parseExternalActionMissionMetadata } from "../utils/parseExternalActionMissionMetadata";
import { useExternalActionMission } from "./useExternalActionMission";
import { useExternalActionMissionDetailController } from "./useExternalActionMissionDetailController";

export type UseMissionDetailExternalActionResult = {
  externalActionSlot: MissionExternalActionDetailSlotProps;
  externalActionController: MissionDetailTypeController;
};

export function useMissionDetailExternalAction(
  mission: MissionRow | undefined,
): UseMissionDetailExternalActionResult {
  const metaParsed = useMemo(
    () =>
      mission?.mission_type === "external_action"
        ? parseExternalActionMissionMetadata(mission.metadata)
        : null,
    [mission],
  );

  const initialServerCompleted = useMemo(() => {
    if (!mission?.mission_completions?.length) return false;
    return isMissionDetailReadonlyOutcome(
      resolveMissionDetailInteractionState(mission.mission_completions),
    );
  }, [mission?.mission_completions]);

  const isExternalType = mission?.mission_type === "external_action";
  const enabled = Boolean(mission?.id && isExternalType && metaParsed);

  const external = useExternalActionMission({
    enabled,
    missionId: mission?.id ?? "",
    metadata: metaParsed ?? {
      external_url: "",
      platform: "",
      action_label: "",
    },
    tokenReward: mission?.token_reward ?? 0,
    initialServerCompleted,
  });

  const externalActionController = useExternalActionMissionDetailController(
    Boolean(isExternalType),
  );

  const externalActionSlot = useMemo((): MissionExternalActionDetailSlotProps => {
    if (!mission || mission.mission_type !== "external_action" || !metaParsed) {
      return null;
    }
    return {
      url: metaParsed.external_url,
      label: metaParsed.action_label,
      platform: metaParsed.platform,
      hasOpenedLink: external.hasOpenedLink,
      canSubmit: external.canSubmit,
      isSubmitting: external.isSubmitting,
      isCompleted: external.isCompleted,
      secondsRemaining: external.secondsRemaining,
      handleLinkOpened: external.handleLinkOpened,
      handleSubmit: external.handleSubmit,
    };
  }, [
    mission,
    metaParsed,
    external.hasOpenedLink,
    external.canSubmit,
    external.isSubmitting,
    external.isCompleted,
    external.secondsRemaining,
    external.handleLinkOpened,
    external.handleSubmit,
  ]);

  return {
    externalActionSlot,
    externalActionController,
  };
}
