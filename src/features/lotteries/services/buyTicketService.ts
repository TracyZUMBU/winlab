import { getSupabaseClient } from "@/src/lib/supabase/client";

export type BuyTicketParams = {
  lotteryId: string;
};

export async function buyTicket({
  lotteryId,
}: BuyTicketParams): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("buy_ticket", {
    p_lottery_id: lotteryId,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("Invalid server response for buy_ticket");
  }

  return data;
}
