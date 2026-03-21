import { getSupabaseClient } from "@/src/lib/supabase/client";

import { getUserTicketsCountForLottery } from "@/src/features/lotteries/services/getUserTicketsCountForLottery";

export type LotteryResultBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type LotteryResultCore = {
  id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  brand: LotteryResultBrand;
};

export type LotteryResultWinnerRow = {
  position: number;
  username: string;
};

export type LotteryResultDetailRow = {
  lottery: LotteryResultCore;
  user_active_tickets_count: number;
  user_winner_position: number | null;
  winners: LotteryResultWinnerRow[];
};

type LotteryResultDbRow = {
  id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  brand: LotteryResultBrand;
};

type WinnerDbRow = {
  position: number;
  user_id: string;
  profiles: { username: string } | null;
};

export async function getLotteryResultById(
  lotteryId: string,
  userId: string,
): Promise<LotteryResultDetailRow | null> {
  const supabase = getSupabaseClient();

  const { data: lotteryData, error: lotteryError } = await supabase
    .from("lotteries")
    .select(
      `
      id,
      title,
      image_url,
      draw_at,
      brand:brands!inner(id, name, logo_url)
    `,
    )
    .eq("id", lotteryId)
    .eq("status", "drawn")
    .eq("brands.is_active", true)
    .maybeSingle();

  if (lotteryError) {
    throw lotteryError;
  }

  if (!lotteryData) {
    return null;
  }

  const userTickets = await getUserTicketsCountForLottery(lotteryId, userId);
  if (userTickets === 0) {
    return null;
  }

  const { data: winnerData, error: winnersError } = await supabase
    .from("lottery_winners")
    .select(
      `
      position,
      user_id,
      profiles (
        username
      )
    `,
    )
    .eq("lottery_id", lotteryId)
    .order("position", { ascending: true });

  if (winnersError) {
    throw winnersError;
  }

  const rawWinners = (winnerData ?? []) as WinnerDbRow[];
  const winners: LotteryResultWinnerRow[] = rawWinners.map((w) => ({
    position: w.position,
    username: w.profiles?.username ?? "",
  }));

  let userWinnerPosition: number | null = null;
  for (const w of rawWinners) {
    if (w.user_id === userId) {
      userWinnerPosition = w.position;
      break;
    }
  }

  const lottery = lotteryData as LotteryResultDbRow;

  return {
    lottery: {
      id: lottery.id,
      title: lottery.title,
      image_url: lottery.image_url,
      draw_at: lottery.draw_at,
      brand: lottery.brand,
    },
    user_active_tickets_count: userTickets,
    user_winner_position: userWinnerPosition,
    winners,
  };
}
