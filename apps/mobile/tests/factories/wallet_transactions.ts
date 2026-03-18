import type { Database } from "@/src/lib/supabase.types";
import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

type WalletTransactionInsert =
  Database["public"]["Tables"]["wallet_transactions"]["Insert"];
type WalletTransactionRow =
  Database["public"]["Tables"]["wallet_transactions"]["Row"];

export const createWalletTransaction = async (
  overrides: Partial<WalletTransactionInsert> = {},
): Promise<WalletTransactionRow> => {
  const supabase = getSupabaseAdminClient();

  if (!overrides.user_id) {
    throw new Error("createWalletTransaction requires user_id");
  }
  if (!overrides.transaction_type) {
    throw new Error("createWalletTransaction requires transaction_type");
  }
  if (!overrides.amount && overrides.amount !== 0) {
    throw new Error("createWalletTransaction requires amount");
  }
  if (!overrides.direction) {
    throw new Error("createWalletTransaction requires direction");
  }

  const payload: WalletTransactionInsert = {
    user_id: overrides.user_id,
    transaction_type: overrides.transaction_type,
    amount: overrides.amount,
    direction: overrides.direction,
    ...overrides,
  };

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
