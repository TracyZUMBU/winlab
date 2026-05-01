import {
  createAuthenticatedTestUser,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
} from "@winlab/supabase-test-utils";

const REGISTER_REFERRAL_RPC = "register_referral_with_code";

const expectRpcRow = (data: unknown) => {
  expect(Array.isArray(data)).toBe(true);
  const rows = data as {
    success: boolean;
    error_code: string | null;
  }[];
  expect(rows).toHaveLength(1);
  return rows[0]!;
};

describe("register_referral_with_code (integration)", () => {
  it("registers pending referral when code matches referrer profile", async () => {
    const admin = getSupabaseAdminClient();
    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const { data: refProfile, error: refProfileError } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", referrer.userId)
      .single();

    expect(refProfileError).toBeNull();
    const code = refProfile?.referral_code;
    if (!code || code.length !== 8) {
      throw new Error("Referrer profile missing canonical referral_code");
    }

    const { data, error } = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: code,
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(true);
    expect(row.error_code).toBeNull();

    const { data: referralRow, error: referralErr } = await admin
      .from("referrals")
      .select("*")
      .eq("referred_user_id", referred.userId)
      .maybeSingle();

    expect(referralErr).toBeNull();
    expect(referralRow?.referrer_user_id).toBe(referrer.userId);
    expect(referralRow?.referral_code).toBe(code);
    expect(referralRow?.status).toBe("pending");
  });

  it("succeeds with empty code without inserting a referral row", async () => {
    const admin = getSupabaseAdminClient();
    const referred = await createAuthenticatedTestUser();

    const { count: before } = await admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referred_user_id", referred.userId);

    const { data, error } = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: "   ",
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(true);
    expect(row.error_code).toBeNull();

    const { count: after } = await admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referred_user_id", referred.userId);

    expect(after ?? 0).toBe(before ?? 0);
  });

  it("returns NOT_AUTHENTICATED without session", async () => {
    const anon = getSupabaseAnonClient();

    const { data, error } = await anon.rpc(REGISTER_REFERRAL_RPC, {
      p_code: "ABCDEFGH",
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(false);
    expect(row.error_code).toBe("NOT_AUTHENTICATED");
  });

  it("rejects invalid code length", async () => {
    const referred = await createAuthenticatedTestUser();

    const { data, error } = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: "SHORT",
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(false);
    expect(row.error_code).toBe("REFERRAL_CODE_INVALID_FORMAT");
  });

  it("rejects unknown referral code", async () => {
    const referred = await createAuthenticatedTestUser();

    const { data, error } = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: "ZZZZZZZZ",
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(false);
    expect(row.error_code).toBe("REFERRAL_CODE_NOT_FOUND");
  });

  it("rejects self-referral", async () => {
    const referrer = await createAuthenticatedTestUser();
    const admin = getSupabaseAdminClient();

    const { data: refProfile, error: refProfileError } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", referrer.userId)
      .single();

    expect(refProfileError).toBeNull();
    const code = refProfile?.referral_code;
    if (!code) throw new Error("Missing referral_code");

    const { data, error } = await referrer.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: code,
    });

    expect(error).toBeNull();
    const row = expectRpcRow(data);
    expect(row.success).toBe(false);
    expect(row.error_code).toBe("REFERRAL_SELF_NOT_ALLOWED");
  });

  it("rejects second registration for same referred user", async () => {
    const admin = getSupabaseAdminClient();
    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const { data: refProfile, error: refProfileError } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", referrer.userId)
      .single();

    expect(refProfileError).toBeNull();
    const code = refProfile?.referral_code;
    if (!code) throw new Error("Missing referral_code");

    const first = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: code,
    });
    expect(first.error).toBeNull();
    expect(expectRpcRow(first.data).success).toBe(true);

    const second = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: code,
    });
    expect(second.error).toBeNull();
    const row2 = expectRpcRow(second.data);
    expect(row2.success).toBe(false);
    expect(row2.error_code).toBe("REFERRAL_ALREADY_REGISTERED");
  });

  it("normalizes lowercase input to match stored referral_code", async () => {
    const admin = getSupabaseAdminClient();
    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const { data: refProfile, error: refProfileError } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", referrer.userId)
      .single();

    expect(refProfileError).toBeNull();
    const code = refProfile?.referral_code;
    if (!code) throw new Error("Missing referral_code");

    const lower = code.toLowerCase();

    const { data, error } = await referred.client.rpc(REGISTER_REFERRAL_RPC, {
      p_code: `  ${lower}  `,
    });

    expect(error).toBeNull();
    expect(expectRpcRow(data).success).toBe(true);

    const { data: referralRow } = await admin
      .from("referrals")
      .select("referral_code")
      .eq("referred_user_id", referred.userId)
      .single();

    expect(referralRow?.referral_code).toBe(code);
  });
});
