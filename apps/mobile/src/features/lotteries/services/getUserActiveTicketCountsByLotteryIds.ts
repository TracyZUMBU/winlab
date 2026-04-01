import { getSupabaseClient } from "@/src/lib/supabase/client";

export type UserActiveTicketCountRow = {
  lottery_id: string;
  active_count: number;
};

/**
 * Batch count of the current user's active tickets per lottery (RPC).
 */
export async function getUserActiveTicketCountsByLotteryIds(
  lotteryIds: string[],
): Promise<Map<string, number>> {
  if (lotteryIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_user_active_ticket_counts_by_lottery",
    { p_lottery_ids: lotteryIds },
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as UserActiveTicketCountRow[];
  const byLotteryId = new Map<string, number>();

  for (const row of rows) {
    byLotteryId.set(row.lottery_id, Number(row.active_count));
  }

  return byLotteryId;
}
