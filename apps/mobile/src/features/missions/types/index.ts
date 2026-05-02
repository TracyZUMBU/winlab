type MissionType =
  | "survey"
  | "video"
  | "follow"
  | "referral"
  | "custom"
  | "daily_login"
  | "external_action";

type MissionStatus = "draft" | "active" | "paused" | "archived";

type MissionValidationMode = "automatic" | "manual";

export type {
  MissionSurveyAnswerStep,
  MissionSurveyAnswerValue,
  MissionSurveyProofPayload,
} from "./surveyProof";

export { MissionType, MissionStatus, MissionValidationMode };
