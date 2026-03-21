import { getSupabaseClient } from "@/src/lib/supabase/client";

export type ParticipatedDrawnLotteryBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type ParticipatedDrawnLotteryRow = {
  id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  brand: ParticipatedDrawnLotteryBrand;
  user_active_tickets_count: number;
  user_winner_position: number | null;
};

type LotteryDrawnDbRow = {
  id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  brand: ParticipatedDrawnLotteryBrand;
};

export async function getParticipatedDrawnLotteries(
  userId: string,
): Promise<ParticipatedDrawnLotteryRow[]> {
  const supabase = getSupabaseClient();

  const { data: ticketRows, error: ticketsError } = await supabase
    .from("lottery_tickets")
    .select("lottery_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (ticketsError) {
    throw ticketsError;
  }

  const participatedIds = [
    ...new Set((ticketRows ?? []).map((r) => r.lottery_id)),
  ];

  if (participatedIds.length === 0) {
    return [];
  }

  const { data: lotteryRows, error: lotteriesError } = await supabase
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
    .in("id", participatedIds)
    .eq("status", "drawn")
    .eq("brands.is_active", true)
    .order("draw_at", { ascending: false });

  if (lotteriesError) {
    throw lotteriesError;
  }

  const lotteries = (lotteryRows ?? []) as LotteryDrawnDbRow[];
  if (lotteries.length === 0) {
    return [];
  }

  const drawnIds = lotteries.map((l) => l.id);

  const { data: countRows, error: countError } = await supabase
    .from("lottery_tickets")
    .select("lottery_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("lottery_id", drawnIds);

  if (countError) {
    throw countError;
  }

  const countsByLotteryId = new Map<string, number>();
  for (const row of countRows ?? []) {
    const id = row.lottery_id;
    countsByLotteryId.set(id, (countsByLotteryId.get(id) ?? 0) + 1);
  }

  const { data: winnerRows, error: winnersError } = await supabase
    .from("lottery_winners")
    .select("lottery_id, position")
    .eq("user_id", userId)
    .in("lottery_id", drawnIds);

  if (winnersError) {
    throw winnersError;
  }

  const positionByLotteryId = new Map<string, number>();
  for (const row of winnerRows ?? []) {
    positionByLotteryId.set(row.lottery_id, row.position);
  }

  return lotteries.map((lottery) => ({
    id: lottery.id,
    title: lottery.title,
    image_url: lottery.image_url,
    draw_at: lottery.draw_at,
    brand: lottery.brand,
    user_active_tickets_count: countsByLotteryId.get(lottery.id) ?? 0,
    user_winner_position: positionByLotteryId.get(lottery.id) ?? null,
  }));
}
