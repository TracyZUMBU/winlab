import { getSupabaseClient } from "@/src/lib/supabase/client";

import type {
  GetAvailableMissionsPageParams,
  GetAvailableMissionsPageResult,
  PagedMissionBrand,
  PagedMissionCompletion,
  PagedMissionRow,
} from "./getAvailableMissionsPage";

export type GetCompletedMissionsPageParams = GetAvailableMissionsPageParams;

export async function getCompletedMissionsPage(
  params: GetCompletedMissionsPageParams,
): Promise<GetAvailableMissionsPageResult> {
  const { userId, pageIndex, pageSize = 15 } = params;
  const supabase = getSupabaseClient();

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("mission_completions")
    .select(
      `
      id,
      status,
      user_id,
      missions!inner(
        id,
        title,
        description,
        mission_type,
        token_reward,
        ends_at,
        image_url,
        brand:brands!inner(id, name, logo_url)
      )
    `,
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  type Row = {
    id: string;
    status: PagedMissionCompletion["status"];
    user_id: string;
    missions: {
      id: string;
      title: string;
      description: string | null;
      mission_type: PagedMissionRow["mission_type"];
      token_reward: number;
      ends_at: string | null;
      image_url: string | null;
      brand: PagedMissionBrand;
    };
  };

  const rows = (data ?? []) as Row[];

  const missions: PagedMissionRow[] = rows.map((row) => {
    const m = row.missions;
    const completion: PagedMissionCompletion = {
      id: row.id,
      status: row.status,
      user_id: row.user_id,
    };
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      mission_type: m.mission_type,
      token_reward: m.token_reward,
      ends_at: m.ends_at,
      image_url: m.image_url,
      brand: m.brand
        ? {
            id: m.brand.id,
            name: m.brand.name,
            logo_url: m.brand.logo_url,
          }
        : null,
      mission_completions: [completion],
    };
  });

  return { missions };
}
