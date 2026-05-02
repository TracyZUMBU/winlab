import { lazy } from "react";

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

type ControllerSet = {
  defaultController: MissionDetailTypeController;
  surveyController: MissionDetailTypeController;
  videoController: MissionDetailTypeController;
};

type RuntimeEntry = {
  Renderer: MissionTypeDetailRenderer;
  buildRendererProps: (
    args: MissionTypeRendererPropsFactoryArgs,
  ) => MissionTypeDetailRendererProps;
  selectController: (controllers: ControllerSet) => MissionDetailTypeController;
};

/** Lazy: évite de charger `expo-video` au chargement de `MissionDetailScreen` pour les missions non-vidéo. */
const VideoMissionDetailLazy = lazy(() => import("./VideoMissionDetail"));

const defaultStackProps: RuntimeEntry["buildRendererProps"] = ({ mission }) => ({
  mission,
  survey: null,
  video: null,
});

const runtimeRegistry: Record<MissionType, RuntimeEntry> = {
  survey: {
    Renderer: SurveyMissionDetail,
    buildRendererProps: ({ mission, survey }) => ({
      mission,
      survey,
      video: null,
    }),
    selectController: ({ surveyController }) => surveyController,
  },
  video: {
    Renderer: VideoMissionDetailLazy,
    buildRendererProps: ({ mission, video }) => ({
      mission,
      survey: null,
      video,
    }),
    selectController: ({ videoController }) => videoController,
  },
  follow: {
    Renderer: FollowMissionDetail,
    buildRendererProps: defaultStackProps,
    selectController: ({ defaultController }) => defaultController,
  },
  referral: {
    Renderer: ReferralMissionDetail,
    buildRendererProps: defaultStackProps,
    selectController: ({ defaultController }) => defaultController,
  },
  custom: {
    Renderer: CustomMissionDetail,
    buildRendererProps: defaultStackProps,
    selectController: ({ defaultController }) => defaultController,
  },
  daily_login: {
    Renderer: DailyLoginMissionDetail,
    buildRendererProps: defaultStackProps,
    selectController: ({ defaultController }) => defaultController,
  },
};

export function getMissionDetailTypeRuntime(missionType: MissionType): RuntimeEntry {
  return runtimeRegistry[missionType];
}
