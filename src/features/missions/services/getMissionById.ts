import { Json } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { MissionType, MissionStatus, MissionValidationMode } from "../types";

type MissionRow = {
  brand_id: string;
  created_at: string;
  description: string | null;
  ends_at: string | null;
  id: string;
  max_completions_per_user: number;
  max_completions_total: number | null;
  metadata: Json | null;
  mission_type: MissionType;
  starts_at: string | null;
  status: MissionStatus;
  title: string;
  token_reward: number;
  updated_at: string;
  validation_mode: MissionValidationMode;
};

export async function getMissionById(missionId: string): Promise<MissionRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
