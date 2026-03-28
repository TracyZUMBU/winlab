import type { Database } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

/** Row returned by RPC `get_wallet_transactions_enriched`. */
export type WalletTransactionRow = {
  id: string;
  amount: number;
  direction: Database["public"]["Enums"]["wallet_direction"];
  transaction_type: Database["public"]["Enums"]["wallet_transaction_type"];
  reference_type: Database["public"]["Enums"]["wallet_reference_type"] | null;
  reference_id: string | null;
  created_at: string;
  context_title: string | null;
};

export async function getWalletTransactions(): Promise<WalletTransactionRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc(
    "get_wallet_transactions_enriched",
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as WalletTransactionRow[];
}
