import type { Enums } from "@/src/lib/supabase.types";
import { theme } from "@/src/theme";

export type MissionTypeVisual = {
  iconColor: string;
  iconBackground: string;
};

/**
 * Per-type tints for home mission teasers — scan-friendly without another all-blue block.
 */
export function missionTypeVisual(
  missionType: Enums<"mission_type">,
): MissionTypeVisual {
  switch (missionType) {
    case "video":
      return {
        iconColor: "#7C3AED",
        iconBackground: "rgba(124, 58, 237, 0.12)",
      };
    case "survey":
      return {
        iconColor: "#0891B2",
        iconBackground: "rgba(8, 145, 178, 0.12)",
      };
    case "referral":
      return {
        iconColor: theme.colors.home.lotteryParticipate,
        iconBackground: "rgba(250, 108, 184, 0.15)",
      };
    case "follow":
      return {
        iconColor: theme.colors.success,
        iconBackground: theme.colors.semantic.successMuted,
      };
    case "daily_login":
      return {
        iconColor: "#D97706",
        iconBackground: theme.colors.semantic.warningMuted,
      };
    case "external_action":
      return {
        iconColor: "#6366F1",
        iconBackground: "rgba(99, 102, 241, 0.12)",
      };
    case "custom":
    default:
      return {
        iconColor: theme.colors.textMuted,
        iconBackground: theme.colors.semantic.neutralMuted,
      };
  }
}
