import type { MissionDetailTypeController } from "../screens/detail-types/types";

/**
 * Missions `external_action` : CTA dans le scroll ; masquer la barre du bas quand `active`.
 */
export function useExternalActionMissionDetailController(
  active: boolean,
): MissionDetailTypeController {
  return {
    hideBottomPrimary: active,
    primary: {
      title: "",
      iconName: "check",
      disabled: true,
      onPress: async () => {},
    },
    secondary: null,
  };
}
