import { createAuthenticatedTestUser } from "../factories/auth";
import { createBrand } from "../factories/brands";
import { createMissionCompletion } from "../factories/mission_completion";
import { createMission } from "../factories/missions";
import { createReferral } from "../factories/referrals";
import { getSupabaseAdminClient } from "../utils/supabaseTestClient";

const APPROVE_MISSION_COMPLETION_RPC = "approve_mission_completion";
const HANDLE_REFERRAL_AFTER_FIRST_MISSION_RPC =
  "handle_referral_after_first_mission";

const expectRpcSuccess = (data: unknown) => {
  expect(Array.isArray(data)).toBe(true);
  const rows = data as {
    success: boolean;
    error_code: string | null;
  }[];
  expect(rows).toHaveLength(1);
  expect(rows[0]?.success).toBe(true);
  expect(rows[0]?.error_code).toBeNull();
};

describe("handle_referral_after_first_mission (integration)", () => {
  it("rewards referrer when referred user gets their first approved mission", async () => {
    const admin = getSupabaseAdminClient();

    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const brand = await createBrand();
    const mission = await createMission({
      brand_id: brand.id,
      validation_mode: "automatic",
      mission_type: "survey",
      token_reward: 20,
    });

    const completion = await createMissionCompletion({
      mission_id: mission.id,
      user_id: referred.userId,
      status: "pending",
      proof_data: {},
    });

    const referral = await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "pending",
    });
    const referralId = referral.id;

    const { data, error } = await referred.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion.id },
    );
    expect(error).toBeNull();
    expectRpcSuccess(data);

    const { data: referralAfter, error: referralAfterError } = await admin
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    expect(referralAfterError).toBeNull();
    if (!referralAfter) throw new Error("Referral row missing after RPC");
    expect(referralAfter?.status).toBe("rewarded");
    expect(referralAfter?.qualified_at).toBeTruthy();
    if (!referralAfter.reward_transaction_id) {
      throw new Error("Missing referral reward_transaction_id");
    }
    const rewardTxId = referralAfter.reward_transaction_id;

    const { data: referralBonusTx, error: txError } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("id", rewardTxId)
      .single();

    expect(txError).toBeNull();
    expect(referralBonusTx?.amount).toBe(30);
    expect(referralBonusTx?.direction).toBe("credit");
    expect(referralBonusTx?.transaction_type).toBe("referral_bonus");
    expect(referralBonusTx?.reference_type).toBe("referral");
    expect(referralBonusTx?.reference_id).toBe(referralId);

    const { data: balanceRow, error: balanceError } = await admin
      .from("user_wallet_balance")
      .select("*")
      .eq("user_id", referrer.userId)
      .single();

    expect(balanceError).toBeNull();
    expect(balanceRow?.balance).toBe(30);
  });

  it("does not reward if referred user already has more than one approved mission", async () => {
    const admin = getSupabaseAdminClient();

    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const brand = await createBrand();

    const mission1 = await createMission({
      brand_id: brand.id,
      validation_mode: "automatic",
      mission_type: "survey",
      token_reward: 20,
    });
    const mission2 = await createMission({
      brand_id: brand.id,
      validation_mode: "automatic",
      mission_type: "survey",
      token_reward: 20,
    });

    // Approve first mission before creating the referral.
    const completion1 = await createMissionCompletion({
      mission_id: mission1.id,
      user_id: referred.userId,
      status: "pending",
      proof_data: {},
    });

    const { error: approve1Error, data: approve1Data } = await referred.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion1.id },
    );
    expect(approve1Error).toBeNull();
    expectRpcSuccess(approve1Data);

    // Create a pending referral only after the first approved mission exists.
    const referral = await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "pending",
    });
    const referralId = referral.id;

    // Approve second mission => approved_count becomes 2 => no referral reward.
    const completion2 = await createMissionCompletion({
      mission_id: mission2.id,
      user_id: referred.userId,
      status: "pending",
      proof_data: {},
    });

    const { error: approve2Error, data: approve2Data } = await referred.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion2.id },
    );
    expect(approve2Error).toBeNull();
    expectRpcSuccess(approve2Data);

    const { data: referralAfter, error: referralAfterError } = await admin
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    expect(referralAfterError).toBeNull();
    if (!referralAfter) throw new Error("Referral row missing after RPC");
    expect(referralAfter?.status).toBe("pending");
    expect(referralAfter?.reward_transaction_id).toBeNull();

    const { data: walletReferralTxs, error: walletError } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", referrer.userId)
      .eq("transaction_type", "referral_bonus");

    expect(walletError).toBeNull();
    expect(walletReferralTxs).toHaveLength(0);
  });

  it("does not reward if referral is not pending", async () => {
    const admin = getSupabaseAdminClient();

    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const brand = await createBrand();
    const mission = await createMission({
      brand_id: brand.id,
      validation_mode: "automatic",
      mission_type: "survey",
      token_reward: 20,
    });

    const completion = await createMissionCompletion({
      mission_id: mission.id,
      user_id: referred.userId,
      status: "pending",
      proof_data: {},
    });

    const referral = await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "qualified",
    });
    const referralId = referral.id;

    const { data, error } = await referred.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion.id },
    );
    expect(error).toBeNull();
    expectRpcSuccess(data);

    const { data: referralAfter, error: referralAfterError } = await admin
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    expect(referralAfterError).toBeNull();
    if (!referralAfter) throw new Error("Referral row missing after RPC");
    expect(referralAfter?.status).toBe("qualified");
    expect(referralAfter?.reward_transaction_id).toBeNull();

    const { data: walletReferralTxs, error: walletError } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", referrer.userId)
      .eq("transaction_type", "referral_bonus");

    expect(walletError).toBeNull();
    expect(walletReferralTxs).toHaveLength(0);
  });

  it("calling handle_referral_after_first_mission directly does nothing when no approved mission exists", async () => {
    const admin = getSupabaseAdminClient();

    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const referral = await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "pending",
    });
    const referralId = referral.id;

    const { error } = await referred.client.rpc(
      HANDLE_REFERRAL_AFTER_FIRST_MISSION_RPC,
      { p_user_id: referred.userId },
    );
    expect(error).toBeNull();

    const { data: referralAfter, error: referralAfterError } = await admin
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    expect(referralAfterError).toBeNull();
    if (!referralAfter) throw new Error("Referral row missing after RPC");
    expect(referralAfter?.status).toBe("pending");
    expect(referralAfter?.reward_transaction_id).toBeNull();

    const { data: walletReferralTxs, error: walletError } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", referrer.userId)
      .eq("transaction_type", "referral_bonus");

    expect(walletError).toBeNull();
    expect(walletReferralTxs).toHaveLength(0);
  });

  it("calling handle_referral_after_first_mission twice does not create a second referral bonus", async () => {
    const admin = getSupabaseAdminClient();

    const referrer = await createAuthenticatedTestUser();
    const referred = await createAuthenticatedTestUser();

    const brand = await createBrand();
    const mission = await createMission({
      brand_id: brand.id,
      validation_mode: "automatic",
      mission_type: "survey",
      token_reward: 20,
    });

    const completion = await createMissionCompletion({
      mission_id: mission.id,
      user_id: referred.userId,
      status: "pending",
      proof_data: {},
    });

    const referral = await createReferral({
      referrer_user_id: referrer.userId,
      referred_user_id: referred.userId,
      status: "pending",
    });
    const referralId = referral.id;

    const { error: approveError, data: approveData } = await referred.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion.id },
    );
    expect(approveError).toBeNull();
    expectRpcSuccess(approveData);

    const { data: walletReferralTxs1, error: wallet1Error } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", referrer.userId)
      .eq("transaction_type", "referral_bonus");

    expect(wallet1Error).toBeNull();
    expect(walletReferralTxs1).toHaveLength(1);

    const { error: secondHandleError } = await referred.client.rpc(
      HANDLE_REFERRAL_AFTER_FIRST_MISSION_RPC,
      { p_user_id: referred.userId },
    );
    expect(secondHandleError).toBeNull();

    const { data: walletReferralTxs2, error: wallet2Error } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", referrer.userId)
      .eq("transaction_type", "referral_bonus");

    expect(wallet2Error).toBeNull();
    expect(walletReferralTxs2).toHaveLength(1);
    expect(walletReferralTxs2?.[0]?.reference_id).toBe(referralId);
  });
});

