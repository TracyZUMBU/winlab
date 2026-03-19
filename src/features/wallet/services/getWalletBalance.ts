import { getSupabaseClient } from "@/src/lib/supabase/client";

export async function getWalletBalance(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_wallet_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.balance ?? 0;
}
