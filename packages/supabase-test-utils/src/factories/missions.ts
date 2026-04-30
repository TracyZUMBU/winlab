import type { Database } from "../databaseTypes";
import { getSupabaseAdminClient } from "../supabaseTestClient";
import { createTestId } from "../testIds";

type MissionInsert = Database["public"]["Tables"]["missions"]["Insert"];
type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

export const createMission = async (
  overrides: Partial<MissionInsert> = {},
): Promise<MissionRow> => {
  const supabase = getSupabaseAdminClient();

  if (!overrides.brand_id) {
    throw new Error("createMission requires brand_id");
  }

  const uniqueId = createTestId("mission");
  const missionType = overrides.mission_type ?? "survey";

  const payload: MissionInsert = {
    brand_id: overrides.brand_id,
    title: `Mission test ${uniqueId}`,
    description: `Mission de test ${uniqueId}`,
    mission_type: "survey",
    validation_mode: "automatic",
    token_reward: 20,
    status: "active",
    max_completions_per_user: missionType === "daily_login" ? null : 1,
    max_completions_total: missionType === "daily_login" ? null : undefined,
    metadata: {},
    ...overrides,
  };

  const { data, error } = await supabase
    .from("missions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
