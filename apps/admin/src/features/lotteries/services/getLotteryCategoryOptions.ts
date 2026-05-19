import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient } from "../../../lib/supabase";

const RPC_ADMIN_GET_LOTTERY_CATEGORIES = "admin_get_lottery_categories";

type CategoryRpcRow = {
  category: string;
};

/**
 * Catégories distinctes déjà utilisées en base (RPC admin, garde `is_admin`).
 */
export async function getLotteryCategoryOptions(): Promise<
  ServiceResult<string[]>
> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc(RPC_ADMIN_GET_LOTTERY_CATEGORIES);

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const categories: string[] = [];
    for (const raw of (data ?? []) as CategoryRpcRow[]) {
      if (typeof raw.category === "string") {
        const trimmed = raw.category.trim();
        if (trimmed.length > 0) {
          categories.push(trimmed);
        }
      }
    }

    return { success: true, data: categories };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
