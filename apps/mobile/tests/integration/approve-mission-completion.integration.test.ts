import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  createMissionCompletion,
  createWalletTransaction,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

// tests/integration/approve-mission-completion.integration.test.ts
const APPROVE_MISSION_COMPLETION_RPC = "approve_mission_completion";
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

const expectRpcBusinessError = (data: unknown, errorCode: string) => {
  expect(Array.isArray(data)).toBe(true);
  const rows = data as {
    success: boolean;
    error_code: string | null;
  }[];
  expect(rows).toHaveLength(1);
  expect(rows[0]?.success).toBe(false);
  expect(rows[0]?.error_code).toBe(errorCode);
};
describe("approve_mission_completion RPC (integration)", () => {
  describe("when approving a mission completion", () => {
    it("approves a mission completion", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
      });
      const completion = await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
        status: "pending",
        proof_data: {},
      });

      const { data, error } = await testUser.client.rpc(
        APPROVE_MISSION_COMPLETION_RPC,
        {
          p_completion_id: completion.id,
        },
      );
      expect(error).toBeNull();
      expectRpcSuccess(data);

      const { data: updatedCompletion, error: completionError } = await admin
        .from("mission_completions")
        .select("*")
        .eq("id", completion.id)
        .single();

      expect(completionError).toBeNull();
      expect(updatedCompletion?.status).toBe("approved");
      expect(updatedCompletion?.reward_transaction_id).toBeTruthy();

      const { data: walletTransaction, error: walletTransactionError } =
        await admin
          .from("wallet_transactions")
          .select("*")
          .eq("reference_id", completion.id)
          .single();

      expect(walletTransactionError).toBeNull();
      expect(walletTransaction).toBeDefined();
      expect(walletTransaction!.amount).toBe(20);
      expect(walletTransaction!.direction).toBe("credit");
      expect(walletTransaction!.transaction_type).toBe("mission_reward");
      expect(walletTransaction!.reference_type).toBe("mission_completion");

      expect(updatedCompletion!.reward_transaction_id).toBe(
        walletTransaction!.id,
      );

      const { data: balanceRow, error: balanceError } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceError).toBeNull();
      expect(balanceRow?.balance).toBe(20);
    });
  });

  describe("when rejecting a mission completion", () => {
    it("rejects a mission completion", async () => {
      const testUser = await createAuthenticatedTestUser();
      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
      });
      const completion = await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
        status: "rejected",
        proof_data: {},
      });

      const { data, error } = await testUser.client.rpc(
        APPROVE_MISSION_COMPLETION_RPC,
        {
          p_completion_id: completion.id,
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_COMPLETION_REJECTED");
    });

    it("rejects a mission completion already rewarded", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
      });

      const completion = await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
        status: "approved",
        proof_data: {},
      });

      const preTx = await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "mission_reward",
        reference_type: "mission_completion",
        reference_id: completion.id,
        amount: 20,
        direction: "credit",
        description: "Pre-existing mission reward",
      });

      const { error: completionUpdateError } = await admin
        .from("mission_completions")
        .update({
          reward_transaction_id: preTx.id,
          status: "approved",
        })
        .eq("id", completion.id);

      expect(completionUpdateError).toBeNull();

      const { data, error } = await testUser.client.rpc(
        APPROVE_MISSION_COMPLETION_RPC,
        {
          p_completion_id: completion.id,
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_COMPLETION_ALREADY_REWARDED");

      const { data: walletAfter, error: walletAfterError } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "mission_reward");

      expect(walletAfterError).toBeNull();
      expect(walletAfter).toHaveLength(1);
      expect(walletAfter?.[0]?.id).toBe(preTx.id);

      const { data: completionAfter, error: completionAfterError } = await admin
        .from("mission_completions")
        .select("*")
        .eq("id", completion.id)
        .single();

      expect(completionAfterError).toBeNull();
      expect(completionAfter?.reward_transaction_id).toBe(preTx.id);
      expect(completionAfter?.status).toBe("approved");
    });

    it("rejects a mission completion not found", async () => {
      const testUser = await createAuthenticatedTestUser();

      const { data, error } = await testUser.client.rpc(
        APPROVE_MISSION_COMPLETION_RPC,
        {
          p_completion_id: "00000000-0000-0000-0000-000000000000",
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_COMPLETION_NOT_FOUND");
    });
  });

  describe("idempotency", () => {
    it("second call returns already rewarded and does not create new tx", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
      });

      const completion = await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
        status: "pending",
        proof_data: {},
      });

      const { data: firstData, error: firstError } = await testUser.client.rpc(
        APPROVE_MISSION_COMPLETION_RPC,
        { p_completion_id: completion.id },
      );

      expect(firstError).toBeNull();
      expectRpcSuccess(firstData);

      const { data: walletAfterFirst, error: walletAfterFirstError } =
        await admin
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", testUser.userId)
          .eq("transaction_type", "mission_reward");

      expect(walletAfterFirstError).toBeNull();
      expect(walletAfterFirst).toHaveLength(1);

      const { data: secondData, error: secondError } =
        await testUser.client.rpc(APPROVE_MISSION_COMPLETION_RPC, {
          p_completion_id: completion.id,
        });

      expect(secondError).toBeNull();
      expectRpcBusinessError(secondData, "MISSION_COMPLETION_ALREADY_REWARDED");

      const { data: walletAfterSecond, error: walletAfterSecondError } =
        await admin
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", testUser.userId)
          .eq("transaction_type", "mission_reward");

      expect(walletAfterSecondError).toBeNull();
      expect(walletAfterSecond).toHaveLength(1);
      expect(walletAfterSecond?.[0]?.id).toBe(walletAfterFirst?.[0]?.id);
    });
  });
});
