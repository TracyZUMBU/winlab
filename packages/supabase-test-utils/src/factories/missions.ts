import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../databaseTypes";
import { getSupabaseAdminClient } from "../supabaseTestClient";
import { createTestId } from "../testIds";

type MissionInsert = Database["public"]["Tables"]["missions"]["Insert"];
type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const defaultRulesText = (uniqueId: string): string =>
  `## Règlement\n\n_Mission de test ${uniqueId}._`;

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
    mission_type: missionType,
    validation_mode: "automatic",
    token_reward: 20,
    status: "active",
    max_completions_per_user: missionType === "daily_login" ? null : 1,
    max_completions_total: missionType === "daily_login" ? null : undefined,
    metadata: {},
    ...overrides,
    rules_text: overrides.rules_text ?? defaultRulesText(uniqueId),
  };

  const { data, error } = await supabase
    .from("missions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

/**
 * Insert mission with an end-user Supabase client (RLS). For integration tests only.
 */
export async function insertMissionWithUserClient(
  client: SupabaseClient<Database>,
  params: {
    brandId: string;
    uniqueSuffix: string;
    rulesText?: string;
    overrides?: Partial<MissionInsert>;
  },
): Promise<{
  data: Pick<MissionRow, "id"> | null;
  error: PostgrestError | null;
}> {
  const rules_text =
    params.rulesText ??
    `## Règlement\n\nTest ${params.uniqueSuffix}.`;

  const payload: MissionInsert = {
    brand_id: params.brandId,
    title: `Mission ${params.uniqueSuffix}`,
    description: null,
    mission_type: "survey",
    token_reward: 10,
    status: "draft",
    max_completions_per_user: 1,
    metadata: {},
    validation_mode: "automatic",
    ...params.overrides,
    rules_text: params.overrides?.rules_text ?? rules_text,
  };

  const { data, error } = await client
    .from("missions")
    .insert(payload)
    .select("id")
    .single();

  return { data, error };
}
