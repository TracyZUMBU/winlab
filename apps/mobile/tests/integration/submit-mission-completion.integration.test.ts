// tests/integration/submit-mission-completion.integration.test.ts
import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  createMissionCompletion,
  createTestUser,
  createWalletTransaction,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  testLinearSurveyMetadata,
  testLinearSurveyProofData,
} from "@winlab/supabase-test-utils";

const SUBMIT_MISSION_COMPLETION_RPC = "submit_mission_completion";

const expectRpcSuccess = (data: unknown) => {
  expect(Array.isArray(data)).toBe(true);
  const rows = data as {
    success: boolean;
    completion_id: string | null;
    error_code: string | null;
  }[];
  expect(rows).toHaveLength(1);
  expect(rows[0]?.success).toBe(true);
  expect(typeof rows[0]?.completion_id).toBe("string");
  expect(rows[0]?.completion_id).toBeTruthy();
  expect(rows[0]?.error_code).toBeNull();
  return rows[0]!.completion_id!;
};

const expectRpcBusinessError = (data: unknown, errorCode: string) => {
  expect(Array.isArray(data)).toBe(true);
  const rows = data as {
    success: boolean;
    completion_id: string | null;
    error_code: string | null;
  }[];
  expect(rows).toHaveLength(1);
  expect(rows[0]?.success).toBe(false);
  expect(rows[0]?.completion_id).toBeNull();
  expect(rows[0]?.error_code).toBe(errorCode);
};

/** Past UTC instant so daily_login is allowed (not the profile creation UTC day). */
const DAILY_LOGIN_ELIGIBLE_PROFILE_CREATED_AT = "2018-01-01T00:00:00.000Z";

async function backdateProfileForDailyLogin(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  userId: string,
) {
  const { error } = await admin
    .from("profiles")
    .update({ created_at: DAILY_LOGIN_ELIGIBLE_PROFILE_CREATED_AT })
    .eq("id", userId);
  expect(error).toBeNull();
}

describe("submit_mission_completion RPC (integration)", () => {
  describe("when submitting a mission completion", () => {
    describe("daily_login", () => {
      it("refuse le jour UTC de creation du profil (DAILY_LOGIN_INELIGIBLE_FIRST_UTC_DAY)", async () => {
        const testUser = await createAuthenticatedTestUser();
        const brand = await createBrand();

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "daily_login",
          token_reward: 10,
        });

        const { data, error } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );
        expect(error).toBeNull();
        expectRpcBusinessError(data, "DAILY_LOGIN_INELIGIBLE_FIRST_UTC_DAY");
      });

      it("obtient les points sur la 1ere connexion de la journee", async () => {
        const testUser = await createAuthenticatedTestUser();
        const admin = getSupabaseAdminClient();
        await backdateProfileForDailyLogin(admin, testUser.userId);
        const brand = await createBrand();

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "daily_login",
          token_reward: 10,
        });

        const { data, error } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );
        expect(error).toBeNull();
        const completionId = expectRpcSuccess(data);

        const { data: completion, error: completionError } = await admin
          .from("mission_completions")
          .select("*")
          .eq("id", completionId)
          .single();

        expect(completionError).toBeNull();
        expect(completion?.status).toBe("approved");
        expect(completion?.reward_transaction_id).toBeTruthy();

        const { data: walletTransactions, error: walletError } = await admin
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", testUser.userId)
          .eq("transaction_type", "mission_reward");

        expect(walletError).toBeNull();
        expect(walletTransactions).toHaveLength(1);
        expect(walletTransactions?.[0]?.amount).toBe(10);
      });

      it("accepte aujourd'hui malgre max_completions_per_user=1 si la seule completion anterieure est sur un autre jour UTC", async () => {
        const testUser = await createAuthenticatedTestUser();
        const admin = getSupabaseAdminClient();
        await backdateProfileForDailyLogin(admin, testUser.userId);
        const brand = await createBrand();

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "daily_login",
          token_reward: 10,
          max_completions_per_user: 1,
        });

        const past = new Date();
        past.setUTCDate(past.getUTCDate() - 5);

        await createMissionCompletion({
          mission_id: mission.id,
          user_id: testUser.userId,
          status: "approved",
          completed_at: past.toISOString(),
          proof_data: {},
        });

        const { data, error } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );

        expect(error).toBeNull();
        expectRpcSuccess(data);
      });

      it("refuse l'obtention si deja connecte aujourd'hui", async () => {
        const testUser = await createAuthenticatedTestUser();
        const admin = getSupabaseAdminClient();
        await backdateProfileForDailyLogin(admin, testUser.userId);
        const brand = await createBrand();

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "daily_login",
          token_reward: 10,
        });

        const { data: firstData, error: firstError } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );
        expect(firstError).toBeNull();
        expectRpcSuccess(firstData);

        const { data: secondData, error: secondError } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );

        expect(secondError).toBeNull();
        expectRpcBusinessError(secondData, "MISSION_USER_LIMIT_REACHED");
      });

      it("autorise l'obtention si la derniere completion date d'hier", async () => {
        const testUser = await createAuthenticatedTestUser();
        const admin = getSupabaseAdminClient();
        await backdateProfileForDailyLogin(admin, testUser.userId);
        const brand = await createBrand();

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "daily_login",
          token_reward: 10,
        });

        const yesterdayIso = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString();

        await createMissionCompletion({
          mission_id: mission.id,
          user_id: testUser.userId,
          status: "approved",
          completed_at: yesterdayIso,
        });

        const { data, error } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: {},
          },
        );
        expect(error).toBeNull();
        const completionId = expectRpcSuccess(data);

        const { data: walletTransactions, error: walletError } = await admin
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", testUser.userId)
          .eq("transaction_type", "mission_reward");

        expect(walletError).toBeNull();
        expect(walletTransactions).toHaveLength(1);
        expect(walletTransactions?.some((tx) => tx.reference_id === completionId)).toBe(
          true,
        );
      });
    });

    describe("external_action", () => {
      it("soumet avec proof_data declarative et credite le wallet (validation automatique)", async () => {
        const testUser = await createAuthenticatedTestUser();
        const admin = getSupabaseAdminClient();
        const brand = await createBrand();

        const proofData = {
          declared: true,
          platform: "instagram",
          opened_link: true,
        };

        const mission = await createMission({
          brand_id: brand.id,
          validation_mode: "automatic",
          mission_type: "external_action",
          token_reward: 15,
          max_completions_per_user: 1,
          metadata: {
            external_url: "https://example.com/winlab",
            platform: "instagram",
            action_label: "Suivre sur Instagram",
            min_external_duration_seconds: 5,
          },
        });

        const { data, error } = await testUser.client.rpc(
          SUBMIT_MISSION_COMPLETION_RPC,
          {
            p_mission_id: mission.id,
            p_proof_data: proofData,
          },
        );
        expect(error).toBeNull();
        const completionId = expectRpcSuccess(data);

        const { data: completion, error: completionError } = await admin
          .from("mission_completions")
          .select("*")
          .eq("id", completionId)
          .single();

        expect(completionError).toBeNull();
        expect(completion?.proof_data).toEqual(proofData);
        expect(completion?.status).toBe("approved");
        expect(completion?.reward_transaction_id).toBeTruthy();

        const { data: walletTransactions, error: walletError } = await admin
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", testUser.userId)
          .eq("transaction_type", "mission_reward");

        expect(walletError).toBeNull();
        expect(walletTransactions).toHaveLength(1);
        expect(walletTransactions?.[0]?.amount).toBe(15);
        expect(walletTransactions?.[0]?.direction).toBe("credit");
      });
    });

    it("soumet une mission automatique et crédite le wallet", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        max_completions_per_user: 1,
        metadata: testLinearSurveyMetadata(),
      });

      const proofData = testLinearSurveyProofData();

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: proofData,
        },
      );
      expect(error).toBeNull();
      const completionId = expectRpcSuccess(data);

      const { data: completion, error: completionError } = await admin
        .from("mission_completions")
        .select("*")
        .eq("id", completionId)
        .single();

      expect(completionError).toBeNull();
      expect(completion?.proof_data).toEqual(proofData);
      expect(completion?.status).toBe("approved");
      expect(completion?.reward_transaction_id).toBeTruthy();

      const { data: walletTransactions, error: walletError } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "mission_reward");

      expect(walletError).toBeNull();
      expect(walletTransactions).toHaveLength(1);
      expect(walletTransactions?.[0]?.amount).toBe(20);
      expect(walletTransactions?.[0]?.direction).toBe("credit");
      expect(walletTransactions?.[0]?.reference_type).toBe(
        "mission_completion",
      );
      expect(walletTransactions?.[0]?.reference_id).toBe(completionId);
      expect(walletTransactions?.[0]?.id).toBe(
        completion?.reward_transaction_id,
      );

      const { data: balanceRow, error: balanceError } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceError).toBeNull();
      expect(balanceRow?.balance).toBe(20);
    });
    it("soumet d'une mission manuelle donc pas de validation automatique", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "manual",
        mission_type: "follow",
        token_reward: 20,
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );
      expect(error).toBeNull();
      const completionId = expectRpcSuccess(data);

      const { data: completion, error: completionError } = await admin
        .from("mission_completions")
        .select("*")
        .eq("id", completionId)
        .single();

      // mission_completions
      expect(completionError).toBeNull();
      expect(completion?.status).toBe("pending");
      expect(completion?.reward_transaction_id).toBeNull();

      // wallet_transactions
      const { error: walletError, data: walletData } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "mission_reward");

      expect(walletError).toBeNull();
      expect(walletData).toEqual([]);
      expect(walletData).toHaveLength(0);
    });
  });

  describe("when criteria are not met", () => {
    it("mission is not found", async () => {
      const testUser = await createAuthenticatedTestUser();

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: "00000000-0000-0000-0000-000000000000",
          p_proof_data: {},
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_NOT_FOUND");
    });
    it("mission is not active", async () => {
      const testUser = await createAuthenticatedTestUser();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        status: "draft",
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_NOT_ACTIVE");
    });
    it("mission is not started yet", async () => {
      const testUser = await createAuthenticatedTestUser();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        starts_at: new Date(Date.now() + 1000).toISOString(),
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_NOT_STARTED");
    });
    it("mission is expired", async () => {
      const testUser = await createAuthenticatedTestUser();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        ends_at: new Date(Date.now() - 1000).toISOString(),
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_EXPIRED");
    });
    it("mission completion limit reached for this user", async () => {
      const testUser = await createAuthenticatedTestUser();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        max_completions_per_user: 1,
      });
      await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_USER_LIMIT_REACHED");
    });
    it("mission completion limit reached for all users", async () => {
      const testUser = await createAuthenticatedTestUser();
      const testUser2 = await createTestUser();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        max_completions_total: 1,
      });

      await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser2.userId,
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );
      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_TOTAL_LIMIT_REACHED");
    });
  });

  describe("survey proof validation", () => {
    it("returns SURVEY_CONFIG_INVALID when survey metadata is missing", async () => {
      const testUser = await createAuthenticatedTestUser();
      const brand = await createBrand();

      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 10,
        metadata: {},
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: testLinearSurveyProofData(),
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "SURVEY_CONFIG_INVALID");
    });

    it("returns SURVEY_PROOF_INVALID when answers array is missing", async () => {
      const testUser = await createAuthenticatedTestUser();
      const brand = await createBrand();

      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 10,
        metadata: testLinearSurveyMetadata(),
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: { surveyId: "" },
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "SURVEY_PROOF_INVALID");
    });

    it("returns SURVEY_ANSWERS_INVALID when the path does not match branching", async () => {
      const testUser = await createAuthenticatedTestUser();
      const brand = await createBrand();

      const metadata = {
        survey: {
          startQuestionId: "q1",
          questions: [
            {
              id: "q1",
              type: "single_choice",
              options: [
                { id: "pick_a", label: "A", nextQuestionId: "q2a" },
                { id: "pick_b", label: "B", nextQuestionId: "q2b" },
              ],
            },
            { id: "q2a", type: "text", nextQuestionId: null },
            { id: "q2b", type: "text", nextQuestionId: null },
          ],
        },
      };

      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 10,
        metadata,
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {
            surveyId: "",
            answers: [
              { questionId: "q1", value: "pick_a" },
              { questionId: "q2b", value: "wrong branch" },
            ],
          },
        },
      );

      expect(error).toBeNull();
      expectRpcBusinessError(data, "SURVEY_ANSWERS_INVALID");
    });

    it("accepts a valid branching path and stores proof_data", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const metadata = {
        survey: {
          startQuestionId: "q1",
          questions: [
            {
              id: "q1",
              type: "single_choice",
              options: [
                { id: "pick_a", label: "A", nextQuestionId: "q2a" },
                { id: "pick_b", label: "B", nextQuestionId: "q2b" },
              ],
            },
            { id: "q2a", type: "text", nextQuestionId: null },
            { id: "q2b", type: "text", nextQuestionId: null },
          ],
        },
      };

      const proofData = {
        surveyId: "",
        answers: [
          { questionId: "q1", value: "pick_a" },
          { questionId: "q2a", value: "ok" },
        ],
      };

      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 10,
        metadata,
      });

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: proofData,
        },
      );

      expect(error).toBeNull();
      const completionId = expectRpcSuccess(data);

      const { data: completion, error: completionError } = await admin
        .from("mission_completions")
        .select("proof_data")
        .eq("id", completionId)
        .single();

      expect(completionError).toBeNull();
      expect(completion?.proof_data).toEqual(proofData);
    });
  });

  describe("business rules", () => {
    it("does not double-credit wallet on double submit (automatic mission)", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        max_completions_per_user: 1,
        metadata: testLinearSurveyMetadata(),
      });

      const proofData = testLinearSurveyProofData();

      const { data: completionId1, error: err1 } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: proofData,
        },
      );
      expect(err1).toBeNull();
      expectRpcSuccess(completionId1);

      const { data: completionId2, error: err2 } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: proofData,
        },
      );

      // Depending on RPC implementation, second call may error or be idempotent.
      expect(err2).toBeNull();
      if (Array.isArray(completionId2) && completionId2[0]?.success === true) {
        expectRpcSuccess(completionId2);
      } else {
        expectRpcBusinessError(completionId2, "MISSION_USER_LIMIT_REACHED");
      }

      const { data: completions, error: completionsError } = await admin
        .from("mission_completions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("mission_id", mission.id);
      expect(completionsError).toBeNull();
      expect(completions).toHaveLength(1);

      const { data: walletTransactions, error: walletError } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "mission_reward");
      expect(walletError).toBeNull();
      expect(walletTransactions).toHaveLength(1);
      expect(walletTransactions?.[0]?.amount).toBe(20);
      expect(walletTransactions?.[0]?.direction).toBe("credit");
    });

    it("rejects submit when not authenticated", async () => {
      const anon = getSupabaseAnonClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        metadata: testLinearSurveyMetadata(),
      });

      const { data, error } = await anon.rpc(SUBMIT_MISSION_COMPLETION_RPC, {
        p_mission_id: mission.id,
        p_proof_data: testLinearSurveyProofData(),
      });

      expect(error).toBeNull();
      expectRpcBusinessError(data, "UNAUTHENTICATED");
    });

    it("does not create a new wallet transaction if completion already has one", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const mission = await createMission({
        brand_id: brand.id,
        validation_mode: "automatic",
        mission_type: "survey",
        token_reward: 20,
        max_completions_per_user: 1,
      });
      // Pre-create a wallet transaction and an approved completion referencing it.
      const preTx = await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "mission_reward",
        reference_type: "mission_completion",
        reference_id: mission.id,
        amount: 20,
        direction: "credit",
        description: "Pre-existing mission reward",
      });

      const preCompletion = await createMissionCompletion({
        mission_id: mission.id,
        user_id: testUser.userId,
        status: "approved",
        proof_data: {},
        reward_transaction_id: preTx.id,
      });
      expect(preCompletion.reward_transaction_id).toBe(preTx.id);

      const { data, error } = await testUser.client.rpc(
        SUBMIT_MISSION_COMPLETION_RPC,
        {
          p_mission_id: mission.id,
          p_proof_data: {},
        },
      );

      // Should not create a second reward. Exact error message depends on business rules.
      expect(error).toBeNull();
      expectRpcBusinessError(data, "MISSION_USER_LIMIT_REACHED");

      const { data: walletTransactions, error: walletError } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "mission_reward");
      expect(walletError).toBeNull();
      expect(walletTransactions).toHaveLength(1);
      expect(walletTransactions?.[0]?.id).toBe(preTx.id);
    });
  });
});
