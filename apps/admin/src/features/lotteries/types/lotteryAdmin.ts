/**
 * Types alignés sur les RPC `admin_get_lotteries` et `admin_get_lottery_detail`.
 * Les comptages bigint sont normalisés en `number` côté client.
 */

export const LOTTERY_ADMIN_STATUSES = [
  "draft",
  "active",
  "closed",
  "drawn",
  "cancelled",
] as const;

export type LotteryAdminKnownStatus = (typeof LOTTERY_ADMIN_STATUSES)[number];

/** Valeur d’enum Postgres `lottery_status` ou valeur inattendue. */
export type LotteryAdminStatus = LotteryAdminKnownStatus | "unknown";

/** Ligne renvoyée par `admin_get_lotteries()`. */
export type AdminLotteryListItem = {
  lottery_id: string;
  title: string;
  status: LotteryAdminStatus;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  ticket_cost: number;
  number_of_winners: number;
  brand_name: string | null;
  tickets_count: number;
  winners_count: number;
};

/**
 * Objet élément du JSON `winners` (agrégation `jsonb_agg` dans `admin_get_lottery_detail`).
 */
export type AdminLotteryWinner = {
  position: number;
  user_id: string;
  username: string | null;
  email: string | null;
  ticket_id: string;
  created_at: string;
};

/** Détail admin : ligne `admin_get_lottery_detail` + `winners` typés. */
export type AdminLotteryDetail = {
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
  winners: AdminLotteryWinner[];
};
