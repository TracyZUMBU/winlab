import type { Enums } from "@/src/lib/supabase.types";

export type HomeDashboardProfile = {
  username: string | null;
  avatar_url: string | null;
};

export type HomeDashboardOngoingLottery = {
  id: string;
  title: string;
  image_url: string | null;
  ticket_cost: number;
  ends_at: string | null;
  is_ending_soon: boolean;
  active_tickets_count: number;
  user_active_tickets_count: number;
};

export type HomeDashboardParticipation = {
  lottery_id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  user_ticket_count: number;
  total_active_tickets: number;
  win_probability: number | null;
};

export type HomeDashboardMissionPreview = {
  id: string;
  title: string;
  mission_type: Enums<"mission_type">;
  token_reward: number;
  image_url: string | null;
  max_completions_per_user: number;
  user_completions_used: number;
};

export type HomeDashboardPayload = {
  profile: HomeDashboardProfile;
  wallet_balance: number;
  ongoing_lotteries: HomeDashboardOngoingLottery[];
  participations: HomeDashboardParticipation[];
  mission_previews: HomeDashboardMissionPreview[];
};
