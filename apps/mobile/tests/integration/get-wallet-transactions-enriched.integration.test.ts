import { createAuthenticatedTestUser } from "../factories/auth";
import { createBrand } from "../factories/brands";
import { createLottery } from "../factories/lotteries";
import { createMissionCompletion } from "../factories/mission_completion";
import { createMission } from "../factories/missions";
import { createWalletTransaction } from "../factories/wallet_transactions";
import {
  getSupabaseAdminClient,
  getSupabaseAnonClient,
} from "../utils/supabaseTestClient";

const RPC = "get_wallet_transactions_enriched";
const BUY_TICKET_RPC = "buy_ticket";
const APPROVE_MISSION_COMPLETION_RPC = "approve_mission_completion";

type BuyTicketRpcRow = {
  success: boolean;
  ticket_id: string | null;
  error_code: string | null;
};

type EnrichedWalletTxRow = {
  id: string;
  amount: number;
  direction: string;
  transaction_type: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  context_title: string | null;
};

describe("get_wallet_transactions_enriched RPC (integration)", () => {
  it("returns context_title = lottery title for ticket_purchase after buy_ticket", async () => {
    const testUser = await createAuthenticatedTestUser();
    const admin = getSupabaseAdminClient();

    const brand = await createBrand();
    const uniqueTitle = `Lottery ctx ${Date.now()}`;
    const lottery = await createLottery({
      brand_id: brand.id,
      title: uniqueTitle,
      ticket_cost: 10,
      status: "active",
      starts_at: null,
      ends_at: new Date(Date.now() + 60_000).toISOString(),
      draw_at: new Date(Date.now() + 120_000).toISOString(),
    });

    await createWalletTransaction({
      user_id: testUser.userId,
      transaction_type: "token_purchase",
      reference_type: "purchase",
      amount: 10,
      direction: "credit",
      description: "Seed for get_wallet_transactions_enriched test",
    });

    const buyResult = await testUser.client.rpc(BUY_TICKET_RPC, {
      p_lottery_id: lottery.id,
    });
    expect(buyResult.error).toBeNull();
    const buyRows = buyResult.data as unknown as BuyTicketRpcRow[];
    expect(buyRows).toHaveLength(1);
    expect(buyRows[0]!.success).toBe(true);

    const { data, error } = await testUser.client.rpc(RPC);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = data as unknown as EnrichedWalletTxRow[];
    const purchaseRow = rows.find(
      (r) => r.transaction_type === "ticket_purchase",
    );
    expect(purchaseRow).toBeDefined();
    expect(purchaseRow!.context_title).toBe(uniqueTitle);

    const { data: walletTx } = await admin
      .from("wallet_transactions")
      .select("id, reference_id, reference_type")
      .eq("id", purchaseRow!.id)
      .single();
    expect(walletTx?.reference_type).toBe("lottery_ticket");
    expect(walletTx?.reference_id).toBe(buyRows[0]!.ticket_id);
  });

  it("returns context_title = mission title for mission_reward after approve", async () => {
    const testUser = await createAuthenticatedTestUser();

    const brand = await createBrand();
    const uniqueTitle = `Mission ctx ${Date.now()}`;
    const mission = await createMission({
      brand_id: brand.id,
      title: uniqueTitle,
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

    const approveResult = await testUser.client.rpc(
      APPROVE_MISSION_COMPLETION_RPC,
      { p_completion_id: completion.id },
    );
    expect(approveResult.error).toBeNull();
    const approveRows = approveResult.data as { success: boolean }[];
    expect(approveRows).toHaveLength(1);
    expect(approveRows[0]!.success).toBe(true);

    const { data, error } = await testUser.client.rpc(RPC);
    expect(error).toBeNull();
    const rows = data as unknown as EnrichedWalletTxRow[];
    const rewardRow = rows.find((r) => r.transaction_type === "mission_reward");
    expect(rewardRow).toBeDefined();
    expect(rewardRow!.context_title).toBe(uniqueTitle);
    expect(rewardRow!.reference_type).toBe("mission_completion");
    expect(rewardRow!.reference_id).toBe(completion.id);
  });

  it("returns no rows when client is not authenticated", async () => {
    const anon = getSupabaseAnonClient();
    const { data, error } = await anon.rpc(RPC);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
