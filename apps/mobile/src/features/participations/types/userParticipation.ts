import type { Enums } from "@/src/lib/supabase.types";

export type UserParticipationRow = {
  lottery_id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  status: Enums<"lottery_status">;
  user_tickets_count: number;
  last_participated_at: string;
};

export type GetUserParticipationsPageParams = {
  pageIndex: number;
  pageSize?: number;
};

export type GetUserParticipationsPageResult = {
  participations: UserParticipationRow[];
};
