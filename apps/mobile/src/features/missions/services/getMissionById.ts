import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { Json } from "@/src/types/json";
import { MissionType, MissionValidationMode } from "../types";

export type MissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type MissionDetailCompletion = {
  id: string;
  status: Enums<"mission_completion_status">;
  user_id: string;
  completed_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MissionRow = {
  id: string;
  title: string;
  token_reward: number;
  description: string | null;
  rules_text: string;
  mission_type: MissionType;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Json | null;
  validation_mode: MissionValidationMode;
  image_url: string | null;
  brand: MissionBrand;
  mission_completions: MissionDetailCompletion[];
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
      rules_text,
      mission_type,
      token_reward,
      starts_at,
      ends_at,
      metadata,
      validation_mode,
      image_url,
      brand:brands!inner(id, name, logo_url),
      mission_completions(id, status, user_id, completed_at, reviewed_at, created_at)
    `,
    )
    .eq("id", missionId)
    .single();
  if (error) {
    throw error;
  }
  const raw = data as Omit<MissionRow, "mission_completions"> & {
    mission_completions: MissionDetailCompletion[] | null;
  };
  return {
    ...raw,
    mission_completions: raw.mission_completions ?? [],
  };
}
