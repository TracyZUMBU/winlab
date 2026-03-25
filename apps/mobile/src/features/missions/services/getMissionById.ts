import { getSupabaseClient } from "@/src/lib/supabase/client";
import { Json } from "@/src/types/json";
import { MissionStatus, MissionType, MissionValidationMode } from "../types";

type MissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

type MissionRow = {
  brand_id: string;
  created_at: string;
  id: string;
  max_completions_per_user: number;
  max_completions_total: number | null;
  status: MissionStatus;
  title: string;
  token_reward: number;
  description: string | null;
  mission_type: MissionType;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Json | null;
  validation_mode: MissionValidationMode;
  updated_at: string;
  brand: MissionBrand;
};

export async function getMissionById(missionId: string): Promise<MissionRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("missions")
    .select(
      `*, brand:brands!inner(id, name, logo_url)`,
    )
    .eq("id", missionId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
