import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { getLotteryActiveTicketCounts } from "./getLotteryActiveTicketCounts";
import { getUserActiveTicketCountsByLotteryIds } from "./getUserActiveTicketCountsByLotteryIds";

export type AvailableLotteryBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};
export type AvailableLotteryRow = {
  id: string;
  title: string;
  short_description: string | null;
  image_url: string | null;
  ticket_cost: number;
  ends_at: string | null;
  category: string | null;
  is_featured: boolean;
  status: Enums<"lottery_status">;
  brand: AvailableLotteryBrand | null;
  active_tickets_count: number;
  user_active_tickets_count: number;
};

type AvailableLotteryDbRow = Omit<
  AvailableLotteryRow,
  "active_tickets_count" | "user_active_tickets_count"
>;

export type GetAvailableLotteriesPageParams = {
  pageIndex: number;
  pageSize?: number;
};

export type GetAvailableLotteriesPageResult = {
  lotteries: AvailableLotteryRow[];
};

export const AVAILABLE_LOTTERIES_PAGE_SIZE = 15;

export async function getAvailableLotteriesPage(
  params: GetAvailableLotteriesPageParams,
): Promise<GetAvailableLotteriesPageResult> {
  const { pageIndex, pageSize = AVAILABLE_LOTTERIES_PAGE_SIZE } = params;
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("lotteries")
    .select(
      `
      id,
      title,
      short_description,
      image_url,
      ticket_cost,
      ends_at,
      category,
      is_featured,
      status,
      brand:brands!inner(id, name, logo_url)
    `,
    )
    .eq("status", "active")
    .eq("brands.is_active", true)
    .or(`starts_at.lte.${now},starts_at.is.null`)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order("is_featured", { ascending: false })
    .order("ends_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AvailableLotteryDbRow[];
  if (rows.length === 0) {
    return { lotteries: [] };
  }

  const ids = rows.map((row) => row.id);

  const [countsByLotteryId, userCountsByLotteryId] = await Promise.all([
    getLotteryActiveTicketCounts(ids),
    getUserActiveTicketCountsByLotteryIds(ids),
  ]);

  return {
    lotteries: rows.map((row) => ({
      ...row,
      active_tickets_count: countsByLotteryId.get(row.id) ?? 0,
      user_active_tickets_count: userCountsByLotteryId.get(row.id) ?? 0,
    })),
  };
}
