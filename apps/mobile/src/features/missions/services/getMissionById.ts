import { getSupabaseClient } from "@/src/lib/supabase/client";
import { Json } from "@/src/types/json";
import { MissionType, MissionValidationMode } from "../types";

type MissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

type MissionRow = {
  id: string;
  title: string;
  token_reward: number;
  description: string | null;
  mission_type: MissionType;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Json | null;
  validation_mode: MissionValidationMode;
  brand: MissionBrand;
};

export async function getMissionById(missionId: string): Promise<MissionRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("missions")
    .select(
      `
      id,
      title,
      description,
      mission_type,
      token_reward,
      starts_at,
      ends_at,
      metadata,
      validation_mode,
      brand:brands!inner(id, name, logo_url)
    `,
    )
    .eq("id", missionId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
