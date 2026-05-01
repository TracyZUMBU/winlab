import {
  createAuthenticatedTestUser,
  createReferral,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const RPC = "get_my_referral_invitees";

describe("get_my_referral_invitees (integration)", () => {
  it("returns invitees with referred usernames for the referrer", async () => {
    const admin = getSupabaseAdminClient();
    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "pending",
    });

    const { data: referredProfile, error: profErr } = await admin
      .from("profiles")
      .select("username")
      .eq("id", referred.userId)
      .single();

    expect(profErr).toBeNull();
    const expectedUsername = referredProfile?.username;
    if (!expectedUsername) throw new Error("Referred profile missing username");

    const { data, error } = await referrer.client.rpc(RPC, {});

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    const rows = data as {
      referral_id: string;
      status: string;
      referred_username: string | null;
    }[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const match = rows.find((r) => r.referred_username === expectedUsername);
    expect(match).toBeTruthy();
    expect(match?.status).toBe("pending");
  });
});
