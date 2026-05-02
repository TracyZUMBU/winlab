import {
  createAuthenticatedTestUser,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const RPC = "grant_signup_bonus";

describe("grant_signup_bonus (integration)", () => {
  it("credits 30 tokens once and returns already_granted on second call", async () => {
    const admin = getSupabaseAdminClient();
    const user = await createAuthenticatedTestUser();

    const { data: first, error: firstErr } = await user.client.rpc(RPC);
    expect(firstErr).toBeNull();
    const firstRows = first as {
      success: boolean;
      already_granted: boolean;
      amount: number;
      error_code: string | null;
    }[];
    expect(firstRows).toHaveLength(1);
    expect(firstRows[0]?.success).toBe(true);
    expect(firstRows[0]?.already_granted).toBe(false);
    expect(firstRows[0]?.amount).toBe(30);
    expect(firstRows[0]?.error_code).toBeNull();

    const { data: txRows, error: txErr } = await admin
      .from("wallet_transactions")
      .select("amount, direction, transaction_type, reference_type, reference_id")
      .eq("user_id", user.userId)
      .eq("transaction_type", "signup_bonus");

    expect(txErr).toBeNull();
    expect(txRows).toHaveLength(1);
    expect(txRows![0]?.amount).toBe(30);
    expect(txRows![0]?.direction).toBe("credit");
    expect(txRows![0]?.reference_type).toBe("profile");
    expect(txRows![0]?.reference_id).toBe(user.userId);

    const { data: balanceRow, error: balanceErr } = await admin
      .from("user_wallet_balance")
      .select("balance")
      .eq("user_id", user.userId)
      .single();

    expect(balanceErr).toBeNull();
    expect(balanceRow?.balance).toBe(30);

    const { data: second, error: secondErr } = await user.client.rpc(RPC);
    expect(secondErr).toBeNull();
    const secondRows = second as typeof firstRows;
    expect(secondRows).toHaveLength(1);
    expect(secondRows[0]?.success).toBe(true);
    expect(secondRows[0]?.already_granted).toBe(true);
    expect(secondRows[0]?.amount).toBe(30);
    expect(secondRows[0]?.error_code).toBeNull();

    const { data: txRows2, error: txErr2 } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", user.userId)
      .eq("transaction_type", "signup_bonus");

    expect(txErr2).toBeNull();
    expect(txRows2).toHaveLength(1);
  });

  it("returns NOT_AUTHENTICATED when auth.uid() is null (service role client)", async () => {
    const admin = getSupabaseAdminClient();

    const { data, error } = await admin.rpc(RPC);
    expect(error).toBeNull();
    const rows = data as {
      success: boolean;
      already_granted: boolean;
      amount: number;
      error_code: string | null;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.success).toBe(false);
    expect(rows[0]?.already_granted).toBe(false);
    expect(rows[0]?.amount).toBe(0);
    expect(rows[0]?.error_code).toBe("NOT_AUTHENTICATED");
  });
});
