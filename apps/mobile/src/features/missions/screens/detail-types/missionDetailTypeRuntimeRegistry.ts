import type { MissionType } from "../../types";
import { CustomMissionDetail } from "./CustomMissionDetail";
import { DailyLoginMissionDetail } from "./DailyLoginMissionDetail";
import { FollowMissionDetail } from "./FollowMissionDetail";
import { ReferralMissionDetail } from "./ReferralMissionDetail";
import { SurveyMissionDetail } from "./SurveyMissionDetail";
import type {
  MissionDetailTypeController,
  MissionTypeDetailRenderer,
  MissionTypeDetailRendererProps,
  MissionTypeRendererPropsFactoryArgs,
} from "./types";
import { VideoMissionDetail } from "./VideoMissionDetail";

type ControllerSet = {
  defaultController: MissionDetailTypeController;
  surveyController: MissionDetailTypeController;
};

type RuntimeEntry = {
  Renderer: MissionTypeDetailRenderer;
  buildRendererProps: (
    args: MissionTypeRendererPropsFactoryArgs,
  ) => MissionTypeDetailRendererProps;
  selectController: (controllers: ControllerSet) => MissionDetailTypeController;
};

const defaultEntry: RuntimeEntry = {
  Renderer: VideoMissionDetail,
  buildRendererProps: ({ mission }) => ({
    mission,
    survey: null,
  }),
  selectController: ({ defaultController }) => defaultController,
};

const runtimeRegistry: Record<MissionType, RuntimeEntry> = {
  survey: {
    Renderer: SurveyMissionDetail,
    buildRendererProps: ({ mission, survey }) => ({
      mission,
      survey,
    }),
    selectController: ({ surveyController }) => surveyController,
  },
  video: {
    ...defaultEntry,
    Renderer: VideoMissionDetail,
  },
  follow: {
    ...defaultEntry,
    Renderer: FollowMissionDetail,
  },
  referral: {
    ...defaultEntry,
    Renderer: ReferralMissionDetail,
  },
  custom: {
    ...defaultEntry,
    Renderer: CustomMissionDetail,
  },
  daily_login: {
    ...defaultEntry,
    Renderer: DailyLoginMissionDetail,
  },
};

export function getMissionDetailTypeRuntime(missionType: MissionType): RuntimeEntry {
  return runtimeRegistry[missionType];
}
