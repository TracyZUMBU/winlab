type MissionType =
  | "survey"
  | "video"
  | "follow"
  | "referral"
  | "custom"
  | "daily_login";

type MissionStatus = "draft" | "active" | "paused" | "archived";

type MissionValidationMode = "automatic" | "manual";

export { MissionType, MissionStatus, MissionValidationMode };
