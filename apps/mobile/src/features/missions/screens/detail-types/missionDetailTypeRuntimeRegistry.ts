import { lazy } from "react";

import type { MissionType } from "../../types";
import { CustomMissionDetail } from "./CustomMissionDetail";
import { DailyLoginMissionDetail } from "./DailyLoginMissionDetail";
import { ExternalActionMissionDetail } from "./ExternalActionMissionDetail";
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
  externalActionController: MissionDetailTypeController;
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
  externalAction: null,
});

const runtimeRegistry: Record<MissionType, RuntimeEntry> = {
  survey: {
    Renderer: SurveyMissionDetail,
    buildRendererProps: ({ mission, survey }) => ({
      mission,
      survey,
      video: null,
      externalAction: null,
    }),
    selectController: ({ surveyController }) => surveyController,
  },
  video: {
    Renderer: VideoMissionDetailLazy,
    buildRendererProps: ({ mission, video }) => ({
      mission,
      survey: null,
      video,
      externalAction: null,
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
  external_action: {
    Renderer: ExternalActionMissionDetail,
    buildRendererProps: ({ mission, externalAction }) => ({
      mission,
      survey: null,
      video: null,
      externalAction,
    }),
    selectController: ({ externalActionController }) => externalActionController,
  },
};

export function getMissionDetailTypeRuntime(missionType: MissionType): RuntimeEntry {
  return runtimeRegistry[missionType];
}
