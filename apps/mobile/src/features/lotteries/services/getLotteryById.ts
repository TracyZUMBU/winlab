import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

import { getLotteryActiveTicketCounts } from "./getLotteryActiveTicketCounts";
import { getUserTicketsCountForLottery } from "./getUserTicketsCountForLottery";

export type LotteryDetailBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type LotteryDetailRow = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  ticket_cost: number;
  ends_at: string | null;
  category: string | null;
  is_featured: boolean;
  status: Enums<"lottery_status">;
  brand: LotteryDetailBrand | null;
  active_tickets_count: number;
  user_active_tickets_count: number;
};

type LotteryDetailDbRow = Omit<
  LotteryDetailRow,
  "active_tickets_count" | "user_active_tickets_count"
>;

export async function getLotteryById(
  lotteryId: string,
  userId: string,
): Promise<LotteryDetailRow> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("lotteries")
    .select(
      `
      id,
      title,
      description,
      short_description,
      image_url,
      ticket_cost,
      ends_at,
      category,
      is_featured,
      status,
      brand:brands!inner(id, name, logo_url)
    `,
    )
    .eq("id", lotteryId)
    .eq("brands.is_active", true)
    .single();

  if (error) {
    throw error;
  }

  const [countsByLotteryId, userActiveTicketsCount] = await Promise.all([
    getLotteryActiveTicketCounts([lotteryId]),
    getUserTicketsCountForLottery(lotteryId, userId),
  ]);

  const row = data as LotteryDetailDbRow;
  return {
    ...row,
    active_tickets_count: countsByLotteryId.get(lotteryId) ?? 0,
    user_active_tickets_count: userActiveTicketsCount,
  };
}
