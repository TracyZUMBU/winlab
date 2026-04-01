import type { Enums } from "@/src/lib/supabase.types";

export function missionTypeToMaterialIconName(
  missionType: Enums<"mission_type">,
):
  | "play-circle-filled"
  | "share"
  | "assignment"
  | "link"
  | "flag" {
  switch (missionType) {
    case "video":
      return "play-circle-filled";
    case "referral":
      return "share";
    case "survey":
      return "assignment";
    case "follow":
      return "link";
    case "custom":
    default:
      return "flag";
  }
}
