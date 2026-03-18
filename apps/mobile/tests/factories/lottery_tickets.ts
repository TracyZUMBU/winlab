import type { Database } from "@/src/lib/supabase.types";
import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

type LotteryTicketInsert =
  Database["public"]["Tables"]["lottery_tickets"]["Insert"];
type LotteryTicketRow = Database["public"]["Tables"]["lottery_tickets"]["Row"];

export const createLotteryTicket = async (
  overrides: Partial<LotteryTicketInsert>,
): Promise<LotteryTicketRow> => {
  if (!overrides.lottery_id) {
    throw new Error("createLotteryTicket requires lottery_id");
  }
  if (!overrides.user_id) {
    throw new Error("createLotteryTicket requires user_id");
  }

  const supabase = getSupabaseAdminClient();

  const payload: LotteryTicketInsert = {
    lottery_id: overrides.lottery_id,
    user_id: overrides.user_id,
    ...overrides,
  };

  const { data, error } = await supabase
    .from("lottery_tickets")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as LotteryTicketRow;
};

export const createLotteryTickets = async (
  payloads: LotteryTicketInsert[],
): Promise<LotteryTicketRow[]> => {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("lottery_tickets")
    .insert(payloads)
    .select("*");

  if (error) throw error;
  return data;
};
