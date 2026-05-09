import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export type PurchasedTicketRow = {
  id: string;
  lottery_id: string;
  purchased_at: string;
  lotteries: {
    title: string;
    status: Enums<"lottery_status">;
    draw_at: string;
  } | null;
};

export async function getPurchasedTickets(
  userId: string,
): Promise<PurchasedTicketRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("lottery_tickets")
    .select(
      `
      id,
      lottery_id,
      purchased_at,
      lotteries ( title, status, draw_at )
    `,
    )
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
