import type { LotteryAdminStatus } from "./lotteryAdmin";

/** Une entrée du tableau JSON `winners` de `admin_lottery_detail`. */
export type LotteryAdminWinnerEntry = {
  position: number;
  user_id: string;
  username: string | null;
  email: string | null;
  ticket_id: string;
  created_at: string;
};

/** Détail admin d’une loterie (vue `admin_lottery_detail`). */
export type LotteryAdminDetail = {
  lottery_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  status: LotteryAdminStatus;
  category: string | null;
  slug: string | null;
  is_featured: boolean;
  ticket_cost: number;
  number_of_winners: number;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  brand_name: string | null;
  tickets_count: number;
  winners_count: number;
  winners: LotteryAdminWinnerEntry[];
};
