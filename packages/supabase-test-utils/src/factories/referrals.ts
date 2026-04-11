import type { Database } from "../databaseTypes";
import { getSupabaseAdminClient } from "../supabaseTestClient";
import { createTestId } from "../testIds";

type ReferralInsert = Database["public"]["Tables"]["referrals"]["Insert"];
type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

export const createReferral = async (
  overrides: Partial<ReferralInsert> = {},
): Promise<ReferralRow> => {
  const supabase = getSupabaseAdminClient();

  if (!overrides.referrer_user_id) {
    throw new Error("createReferral requires referrer_user_id");
  }
  if (!overrides.referred_user_id) {
    throw new Error("createReferral requires referred_user_id");
  }
  if (overrides.referrer_user_id === overrides.referred_user_id) {
    throw new Error(
      "createReferral requires different referrer_user_id and referred_user_id",
    );
  }

  const uniqueId = createTestId("referral");

  const payload: ReferralInsert = {
    ...overrides,
    referrer_user_id: overrides.referrer_user_id,
    referred_user_id: overrides.referred_user_id,
    referral_code: overrides.referral_code ?? `REF-${uniqueId}`,
    status: overrides.status ?? "pending",
  };

  const { data, error } = await supabase
    .from("referrals")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
