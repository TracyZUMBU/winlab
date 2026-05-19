import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient } from "../../../lib/supabase";
import type { LotteryFormBrandOption } from "../types/lotteryAdmin";

/**
 * Marques actives pour le formulaire de création loterie (RLS `authenticated` + `is_active`).
 */
export async function getActiveBrandsForLotteryForm(): Promise<
  ServiceResult<LotteryFormBrandOption[]>
> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const options: LotteryFormBrandOption[] = [];
    for (const row of data ?? []) {
      if (
        typeof row.id === "string" &&
        row.id.length > 0 &&
        typeof row.name === "string" &&
        row.name.length > 0 &&
        typeof row.slug === "string" &&
        row.slug.length > 0
      ) {
        options.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
        });
      }
    }

    return { success: true, data: options };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
