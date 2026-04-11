import type { Database } from "../databaseTypes";
import { createTestId } from "../testIds";
import { getSupabaseAdminClient } from "../supabaseTestClient";

type LotteryInsert = Database["public"]["Tables"]["lotteries"]["Insert"];
type LotteryRow = Database["public"]["Tables"]["lotteries"]["Row"];

export const createLottery = async (
  overrides: Partial<LotteryInsert> = {},
): Promise<LotteryRow> => {
  const supabase = getSupabaseAdminClient();

  if (!overrides.brand_id) {
    throw new Error("createLottery requires brand_id");
  }

  const uniqueId = createTestId("lottery");
  const now = Date.now();

  const payload: LotteryInsert = {
    brand_id: overrides.brand_id,
    title: `Lottery test ${uniqueId}`,
    ticket_cost: 10,
    number_of_winners: 1,
    draw_at: new Date(now + 120_000).toISOString(),
    ...overrides,
  };

  const { data, error } = await supabase
    .from("lotteries")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
