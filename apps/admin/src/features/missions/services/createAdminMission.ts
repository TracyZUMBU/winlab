import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient } from "../../../lib/supabase";
import {
  MISSION_CREATE_TYPES,
  type CreateAdminMissionInput,
  type CreatedAdminMission,
} from "../types/missionAdmin";

const TYPE_SET = new Set<string>(MISSION_CREATE_TYPES);

function isValidMissionType(value: string): boolean {
  return TYPE_SET.has(value);
}

/**
 * Crée une mission via le client Supabase (RLS : réservé aux admins).
 * Le statut par défaut est **`draft`** si `status` est omis.
 */
export async function createAdminMission(
  input: CreateAdminMissionInput,
): Promise<ServiceResult<CreatedAdminMission>> {
  try {
    const brand_id = String(input.brand_id).trim();
    const title = String(input.title).trim();
    const rules_text = String(input.rules_text).trim();

    if (!brand_id || !title || !rules_text) {
      return { success: false, errorCode: "INVALID_PAYLOAD" };
    }

    const mission_type = String(input.mission_type);
    if (!isValidMissionType(mission_type)) {
      return { success: false, errorCode: "INVALID_PAYLOAD" };
    }

    if (
      typeof input.token_reward !== "number" ||
      !Number.isFinite(input.token_reward) ||
      input.token_reward <= 0
    ) {
      return { success: false, errorCode: "INVALID_PAYLOAD" };
    }

    const status = input.status ?? "draft";
    const maxPerUser =
      input.max_completions_per_user !== undefined
        ? input.max_completions_per_user
        : mission_type === "daily_login"
          ? null
          : 1;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("missions")
      .insert({
        brand_id,
        title,
        description: input.description ?? null,
        mission_type,
        token_reward: input.token_reward,
        validation_mode: input.validation_mode,
        rules_text,
        status,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
        max_completions_total: input.max_completions_total ?? null,
        max_completions_per_user: maxPerUser,
        metadata: input.metadata ?? {},
        image_url: input.image_url ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const id = data?.id;
    if (typeof id !== "string" || id.length === 0) {
      return { success: false, errorCode: "UNKNOWN" };
    }

    return { success: true, data: { id } };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
