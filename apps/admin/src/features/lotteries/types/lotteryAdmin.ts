/**
 * Données admin liste (aligné sur la RPC `admin_get_lotteries` + champ `id` = lottery_id pour l’UI).
 * `status` reflète l’enum Postgres `lottery_status` ; `unknown` couvre les valeurs inattendues.
 */

export const LOTTERY_ADMIN_STATUSES = [
  "draft",
  "active",
  "closed",
  "drawn",
  "cancelled",
] as const;

export type LotteryAdminKnownStatus = (typeof LOTTERY_ADMIN_STATUSES)[number];

export type LotteryAdminStatus = LotteryAdminKnownStatus | "unknown";

export type LotteryAdminListItem = {
  /** Identifiant loterie (= `lottery_id` côté vue). */
  id: string;
  title: string;
  status: LotteryAdminStatus;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  ticket_cost: number;
  /** Nombre de places / gagnants prévus pour la loterie. */
  number_of_winners: number;
  brand_name: string | null;
  /** Nombre de tickets en base pour cette loterie. */
  tickets_count: number;
  /** Nombre de lignes gagnants enregistrées. */
  winners_count: number;
};

export type GetLotteriesResult = {
  lotteries: LotteryAdminListItem[];
};
