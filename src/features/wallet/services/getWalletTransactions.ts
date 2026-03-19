import type { Database } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export type WalletTransactionRow = Pick<
  Database["public"]["Tables"]["wallet_transactions"]["Row"],
  | "amount"
  | "direction"
  | "transaction_type"
  | "reference_type"
  | "reference_id"
  | "created_at"
>;

export async function getWalletTransactions(
  userId: string,
): Promise<WalletTransactionRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select(
      "amount, direction, transaction_type, reference_type, reference_id, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
