import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

import { getLotteryActiveTicketCounts } from "./getLotteryActiveTicketCounts";

export type AvailableLotteryBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type AvailableLotteryRow = {
  id: string;
  title: string;
  image_url: string | null;
  ticket_cost: number;
  ends_at: string | null;
  category: string | null;
  status: Enums<"lottery_status">;
  brand: AvailableLotteryBrand | null;
  active_tickets_count: number;
};

type AvailableLotteryDbRow = Omit<AvailableLotteryRow, "active_tickets_count">;

export async function getAvailableLotteries(): Promise<AvailableLotteryRow[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lotteries")
    .select(
      `
      id,
      title,
      image_url,
      ticket_cost,
      ends_at,
      category,
      status,
      brand:brands!inner(id, name, logo_url)
    `,
    )
    .eq("status", "active")
    .eq("brands.is_active", true)
    .or(`starts_at.lte.${now},starts_at.is.null`)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order("ends_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AvailableLotteryDbRow[];
  if (rows.length === 0) {
    return [];
  }

  const countsByLotteryId = await getLotteryActiveTicketCounts(
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    ...row,
    active_tickets_count: countsByLotteryId.get(row.id) ?? 0,
  }));
}
