import type { Enums } from "@/src/lib/supabase.types";

export function missionTypeToMaterialIconName(
  missionType: Enums<"mission_type">,
):
  | "play-circle-filled"
  | "share"
  | "assignment"
  | "link"
  | "flag"
  | "today"
  | "open-in-new" {
  switch (missionType) {
    case "video":
      return "play-circle-filled";
    case "referral":
      return "share";
    case "survey":
      return "assignment";
    case "follow":
      return "link";
    case "daily_login":
      return "today";
    case "external_action":
      return "open-in-new";
    case "custom":
    default:
      return "flag";
  }
}
