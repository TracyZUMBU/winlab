import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export type PagedMissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type PagedMissionCompletion = {
  id: string;
  status: Enums<"mission_completion_status">;
  user_id: string;
};

export type PagedMissionRow = {
  id: string;
  title: string;
  description: string | null;
  mission_type: Enums<"mission_type">;
  token_reward: number;
  ends_at: string | null;
  brand: PagedMissionBrand | null;
  mission_completions: PagedMissionCompletion[];
};

export type GetAvailableMissionsPageParams = {
  userId: string;
  pageIndex: number;
  pageSize?: number;
};

export type GetAvailableMissionsPageResult = {
  missions: PagedMissionRow[];
};

const DEFAULT_PAGE_SIZE = 15;

export async function getAvailableMissionsPage(
  params: GetAvailableMissionsPageParams,
): Promise<GetAvailableMissionsPageResult> {
  const { userId, pageIndex, pageSize = DEFAULT_PAGE_SIZE } = params;
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("missions")
    .select(
      `
      id,
      title,
      description,
      mission_type,
      token_reward,
      ends_at,
      brand:brands!inner(id, name, logo_url),
      mission_completions(id, status, user_id)
    `,
    )
    .eq("status", "active")
    .eq("brands.is_active", true)
    .or(`starts_at.lte.${now},starts_at.is.null`)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order("ends_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as (Omit<PagedMissionRow, "mission_completions"> & {
    mission_completions: PagedMissionCompletion[];
  })[];

  return {
    missions: rows.map((row) => ({
      ...row,
      mission_completions: row.mission_completions.filter(
        (c) => c.user_id === userId,
      ),
    })),
  };
}
