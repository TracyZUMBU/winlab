import type { Database } from "@/src/lib/supabase.types";
import { createTestId } from "@/tests/utils/testIds";
import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"];
type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

export const createBrand = async (
  overrides: Partial<BrandInsert> = {},
): Promise<BrandRow> => {
  const supabase = getSupabaseAdminClient();

  const uniqueId = createTestId("brand");

  const payload: BrandInsert = {
    name: `Test brand ${uniqueId}`,
    slug: `test-brand-${uniqueId}`,
    is_active: true,
    ...overrides,
  };

  const { data, error } = await supabase
    .from("brands")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
