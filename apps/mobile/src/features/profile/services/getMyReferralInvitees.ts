import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { Database } from "@/src/lib/supabase.types";

export type ReferralInviteeRow = {
  referralId: string;
  status: Database["public"]["Enums"]["referral_status"];
  qualifiedAt: string | null;
  createdAt: string;
  referredUsername: string | null;
};

export async function getMyReferralInvitees(): Promise<ReferralInviteeRow[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("get_my_referral_invitees");

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  return rows.map((row) => ({
    referralId: row.referral_id,
    status: row.status,
    qualifiedAt: row.qualified_at,
    createdAt: row.created_at,
    referredUsername: row.referred_username,
  }));
}
