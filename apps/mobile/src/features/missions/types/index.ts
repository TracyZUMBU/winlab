type MissionType =
  | "survey"
  | "video"
  | "follow"
  | "referral"
  | "custom"
  | "daily_login";

type MissionStatus = "draft" | "active" | "paused" | "archived";

type MissionValidationMode = "automatic" | "manual";

export type {
  MissionSurveyAnswerStep,
  MissionSurveyAnswerValue,
  MissionSurveyProofPayload,
} from "./surveyProof";

export { MissionType, MissionStatus, MissionValidationMode };
