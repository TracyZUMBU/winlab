import { getSupabaseClient } from "@/src/lib/supabase/client";

export async function getUserTicketsCountForLottery(
  lotteryId: string,
  userId: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("lottery_tickets")
    .select("id", { count: "exact", head: true })
    .eq("lottery_id", lotteryId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return count ?? 0;
}
