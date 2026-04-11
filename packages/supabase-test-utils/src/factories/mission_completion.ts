import type { Database } from "../databaseTypes";
import { getSupabaseAdminClient } from "../supabaseTestClient";

type MissionCompletionInsert =
  Database["public"]["Tables"]["mission_completions"]["Insert"];
type MissionCompletionRow =
  Database["public"]["Tables"]["mission_completions"]["Row"];

export const createMissionCompletion = async (
  overrides: Partial<MissionCompletionInsert> = {},
): Promise<MissionCompletionRow> => {
  const supabase = getSupabaseAdminClient();

  if (!overrides.mission_id) {
    throw new Error("createMissionCompletion requires mission_id");
  }
  if (!overrides.user_id) {
    throw new Error("createMissionCompletion requires user_id");
  }

  const payload: MissionCompletionInsert = {
    mission_id: overrides.mission_id,
    user_id: overrides.user_id,
    ...overrides,
  };

  const { data, error } = await supabase
    .from("mission_completions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
