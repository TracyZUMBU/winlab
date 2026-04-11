import type { Database } from "../databaseTypes";
import { getSupabaseAdminClient } from "../supabaseTestClient";

type LotteryWinnerInsert =
  Database["public"]["Tables"]["lottery_winners"]["Insert"];
type LotteryWinnerRow = Database["public"]["Tables"]["lottery_winners"]["Row"];

export const createLotteryWinner = async (
  overrides: LotteryWinnerInsert,
): Promise<LotteryWinnerRow> => {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("lottery_winners")
    .insert(overrides)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
