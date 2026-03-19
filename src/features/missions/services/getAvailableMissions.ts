import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export type AvailableMissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type AvailableMissionCompletion = {
  id: string;
  status: Enums<"mission_completion_status">;
  user_id: string;
};

export type AvailableMissionRow = {
  id: string;
  title: string;
  description: string | null;
  mission_type: Enums<"mission_type">;
  token_reward: number;
  ends_at: string | null;
  brand: AvailableMissionBrand | null;
  mission_completions: AvailableMissionCompletion[];
};

export async function getAvailableMissions(
  userId: string
): Promise<AvailableMissionRow[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

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
    `
    )
    .eq("status", "active")
    .eq("brands.is_active", true)
    .or(`starts_at.lte.${now},starts_at.is.null`)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order("ends_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as (Omit<AvailableMissionRow, "mission_completions"> & {
    mission_completions: AvailableMissionCompletion[];
  })[];
  return rows.map((row) => ({
    ...row,
    mission_completions: row.mission_completions.filter((c) => c.user_id === userId),
  }));
}
