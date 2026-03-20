import { getSupabaseClient } from "@/src/lib/supabase/client";

export type LotteryActiveTicketCountRow = {
  lottery_id: string;
  active_tickets_count: number;
};

export async function getLotteryActiveTicketCounts(
  lotteryIds: string[],
): Promise<Map<string, number>> {
  if (lotteryIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("get_lottery_active_ticket_counts", {
    p_lottery_ids: lotteryIds,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as LotteryActiveTicketCountRow[];
  const byLotteryId = new Map<string, number>();

  for (const row of rows) {
    byLotteryId.set(row.lottery_id, row.active_tickets_count);
  }

  return byLotteryId;
}
