import { getSupabaseClient } from "../../../lib/supabase";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";

export type AdminBrandFilterOption = {
  id: string;
  name: string;
};

/**
 * Options pour le filtre « marque » sur la liste missions.
 * Lecture `brands` actives (RLS `authenticated` + `is_active`) — pas un contournement des RPC missions.
 */
export async function getActiveBrandsForMissionFilters(): Promise<
  ServiceResult<AdminBrandFilterOption[]>
> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const rows = (data ?? []) as { id: string; name: string }[];
    const options: AdminBrandFilterOption[] = [];
    for (const row of rows) {
      if (
        typeof row.id === "string" &&
        row.id.length > 0 &&
        typeof row.name === "string" &&
        row.name.length > 0
      ) {
        options.push({ id: row.id, name: row.name });
      }
    }

    return { success: true, data: options };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
