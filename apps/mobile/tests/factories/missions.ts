import type { Database } from "@/src/lib/supabase.types";
import { createTestId } from "@/tests/utils/testIds";
import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

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

  const payload: MissionInsert = {
    brand_id: overrides.brand_id,
    title: `Mission test ${uniqueId}`,
    description: `Mission de test ${uniqueId}`,
    mission_type: "survey",
    validation_mode: "automatic",
    token_reward: 20,
    status: "active",
    max_completions_per_user: 1,
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
