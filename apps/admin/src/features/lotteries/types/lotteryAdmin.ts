/**
 * Vue admin des loteries (champs utiles pour listes / consultation).
 * `status` reflète l’enum Postgres `lottery_status` ; la valeur `unknown` couvre les données inattendues.
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
  id: string;
  title: string;
  status: LotteryAdminStatus;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  ticket_cost: number;
  number_of_winners: number;
  brand_id: string;
  /** Nom de la marque liée ; `null` si jointure absente ou nom illisible. */
  brand_name: string | null;
};

export type GetLotteriesResult = {
  lotteries: LotteryAdminListItem[];
};
