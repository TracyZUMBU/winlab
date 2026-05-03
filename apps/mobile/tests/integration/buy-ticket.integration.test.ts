import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  createWalletTransaction,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const BUY_TICKET_RPC = "buy_ticket";

type BuyTicketRpcRow = {
  success: boolean;
  ticket_id: string | null;
  error_code: string | null;
};

const expectRpcBusinessErrorCode = (
  result: { data: unknown; error: any },
  expectedErrorCode: string,
) => {
  expect(result.error).toBeNull();
  expect(Array.isArray(result.data)).toBe(true);
  const rows = result.data as unknown as BuyTicketRpcRow[];
  expect(rows).toHaveLength(1);
  expect(rows[0]!.success).toBe(false);
  expect(rows[0]!.ticket_id).toBeNull();
  expect(rows[0]!.error_code).toBe(expectedErrorCode);
};

describe("buy_ticket RPC (integration)", () => {
  describe("achat nominal", () => {
    it("creates exactly 1 wallet debit and 1 lottery ticket", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const lottery = await createLottery({
        brand_id: brand.id,
        ticket_cost: 10,
        status: "active",
        starts_at: null,
        ends_at: new Date(Date.now() + 60_000).toISOString(), // end in 1 minute
        draw_at: new Date(Date.now() + 120_000).toISOString(), // draw in 2 minutes
      });

      // Seed wallet: credit the user with enough tokens.
      await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "token_purchase",
        reference_type: "purchase",
        amount: 10,
        direction: "credit",
        description: "Seed tokens for buy_ticket nominal test",
      });
      //@ts-ignore
      const rpcResult = await testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });

      expect(rpcResult.error).toBeNull();
      expect(Array.isArray(rpcResult.data)).toBe(true);
      const rows = rpcResult.data as unknown as BuyTicketRpcRow[];
      expect(rows).toHaveLength(1);
      expect(rows[0]!.success).toBe(true);
      const ticketId = rows[0]!.ticket_id as string;
      expect(typeof ticketId).toBe("string");
      expect(ticketId.length).toBeGreaterThan(10);

      // Ticket row
      const { data: ticketRow, error: ticketErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      expect(ticketErr).toBeNull();
      expect(ticketRow).toBeDefined();
      expect(ticketRow!.id).toBe(ticketId);
      expect(ticketRow!.lottery_id).toBe(lottery.id);
      expect(ticketRow!.user_id).toBe(testUser.userId);
      expect(ticketRow!.wallet_transaction_id).toBeTruthy();

      // Wallet transaction row
      const { data: walletTx, error: walletTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("id", ticketRow!.wallet_transaction_id as string)
        .single();

      expect(walletTxErr).toBeNull();
      expect(walletTx).toBeDefined();
      expect(walletTx!.user_id).toBe(testUser.userId);
      expect(walletTx!.amount).toBe(10);
      expect(walletTx!.direction).toBe("debit");
      expect(walletTx!.transaction_type).toBe("ticket_purchase");
      expect(walletTx!.reference_type).toBe("lottery_ticket");
      expect(walletTx!.reference_id).toBe(ticketId);

      // Link integrity
      expect(walletTx!.id).toBe(ticketRow!.wallet_transaction_id);

      // Balance after debit: credit 10 - debit 10 = 0
      const { data: balanceRow, error: balanceErr } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceErr).toBeNull();
      expect(balanceRow?.balance).toBe(0);

      // Exactly one purchase = exactly one ticket + one debit tx
      const { data: ticketRows, error: ticketRowsErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("lottery_id", lottery.id);
      expect(ticketRowsErr).toBeNull();
      expect(ticketRows).toHaveLength(1);

      const { data: debitTxRows, error: debitTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "ticket_purchase");
      expect(debitTxErr).toBeNull();
      expect(debitTxRows).toHaveLength(1);
    });
  });

  describe("insufficient balance", () => {
    it("does not create a wallet debit nor a ticket", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const ticketCost = 10;
      const lottery = await createLottery({
        brand_id: brand.id,
        ticket_cost: ticketCost,
        status: "active",
        starts_at: null,
        ends_at: new Date(Date.now() + 60_000).toISOString(),
        draw_at: new Date(Date.now() + 120_000).toISOString(),
      });

      const seedAmount = ticketCost - 1;
      await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "token_purchase",
        reference_type: "purchase",
        amount: seedAmount,
        direction: "credit",
        description: "Seed tokens for buy_ticket insufficient balance test",
      });

      const rpcResult = await testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });

      expectRpcBusinessErrorCode(rpcResult as any, "INSUFFICIENT_TOKENS");

      const { data: tickets, error: ticketsErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("lottery_id", lottery.id);

      expect(ticketsErr).toBeNull();
      expect(tickets).toHaveLength(0);

      const { data: debitTxRows, error: debitTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "ticket_purchase");

      expect(debitTxErr).toBeNull();
      expect(debitTxRows).toHaveLength(0);

      const { data: balanceRow, error: balanceErr } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceErr).toBeNull();
      expect(balanceRow?.balance).toBe(seedAmount);
    });
  });

  describe("loterie expirée", () => {
    it("does not create a wallet debit nor a ticket when ends_at is in the past (row auto-closed)", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const ticketCost = 10;

      const lottery = await createLottery({
        brand_id: brand.id,
        ticket_cost: ticketCost,
        status: "active",
        starts_at: null,
        ends_at: new Date(Date.now() - 60_000).toISOString(),
        draw_at: new Date(Date.now() + 120_000).toISOString(),
      });

      await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "token_purchase",
        reference_type: "purchase",
        amount: ticketCost,
        direction: "credit",
        description: "Seed tokens for buy_ticket expired lottery test",
      });

      const rpcResult = await testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });

      // BEFORE INSERT trigger closes active lotteries when ends_at <= now(), so buy_ticket
      // sees status !== active and returns LOTTERY_NOT_PURCHASABLE (not LOTTERY_EXPIRED).
      expectRpcBusinessErrorCode(rpcResult as any, "LOTTERY_NOT_PURCHASABLE");

      // Should not create any ticket.
      const { data: tickets, error: ticketsErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("lottery_id", lottery.id);

      expect(ticketsErr).toBeNull();
      expect(tickets).toHaveLength(0);

      // Should not create any wallet debit.
      const { data: debitTxRows, error: debitTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "ticket_purchase");

      expect(debitTxErr).toBeNull();
      expect(debitTxRows).toHaveLength(0);

      // Balance should remain unchanged.
      const { data: balanceRow, error: balanceErr } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceErr).toBeNull();
      expect(balanceRow?.balance).toBe(ticketCost);
    });
  });

  describe("loterie inactive", () => {
    it("does not create a wallet debit nor a ticket when status is not active", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const ticketCost = 10;

      const lottery = await createLottery({
        brand_id: brand.id,
        ticket_cost: ticketCost,
        status: "draft",
        starts_at: null,
        ends_at: new Date(Date.now() + 60_000).toISOString(),
        draw_at: new Date(Date.now() + 120_000).toISOString(),
      });

      await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "token_purchase",
        reference_type: "purchase",
        amount: ticketCost,
        direction: "credit",
        description: "Seed tokens for buy_ticket inactive lottery test",
      });

      const rpcResult = await testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });

      expectRpcBusinessErrorCode(rpcResult as any, "LOTTERY_NOT_PURCHASABLE");

      const { data: tickets, error: ticketsErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("lottery_id", lottery.id);

      expect(ticketsErr).toBeNull();
      expect(tickets).toHaveLength(0);

      const { data: debitTxRows, error: debitTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "ticket_purchase");

      expect(debitTxErr).toBeNull();
      expect(debitTxRows).toHaveLength(0);

      const { data: balanceRow, error: balanceErr } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceErr).toBeNull();
      expect(balanceRow?.balance).toBe(ticketCost);
    });
  });

  describe("double achat concurrent", () => {
    it("creates only 1 ticket (serialized by RPC) when called twice concurrently", async () => {
      const testUser = await createAuthenticatedTestUser();
      const admin = getSupabaseAdminClient();

      const brand = await createBrand();
      const ticketCost = 10;
      const lottery = await createLottery({
        brand_id: brand.id,
        ticket_cost: ticketCost,
        status: "active",
        starts_at: null,
        ends_at: new Date(Date.now() + 60_000).toISOString(),
        draw_at: new Date(Date.now() + 120_000).toISOString(),
      });

      // Seed wallet with exactly ticket_cost so only one purchase should succeed.
      await createWalletTransaction({
        user_id: testUser.userId,
        transaction_type: "token_purchase",
        reference_type: "purchase",
        amount: ticketCost,
        direction: "credit",
        description: "Seed tokens for buy_ticket concurrent test",
      });

      const rpcPromise1 = testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });
      const rpcPromise2 = testUser.client.rpc(BUY_TICKET_RPC, {
        p_lottery_id: lottery.id,
      });

      const [rpcResult1, rpcResult2] = await Promise.all([
        rpcPromise1,
        rpcPromise2,
      ]);

      const results = [rpcResult1, rpcResult2] as any[];
      const successes = results.filter((r) => {
        if (r.error) return false;
        const rows = r.data as unknown as BuyTicketRpcRow[];
        return Array.isArray(rows) && rows.length === 1 && rows[0]!.success === true;
      });
      const failures = results.filter((r) => {
        if (r.error) return true;
        const rows = r.data as unknown as BuyTicketRpcRow[];
        return Array.isArray(rows) && rows.length === 1 && rows[0]!.success === false;
      });

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      const createdTicketId = (
        successes[0]!.data as unknown as BuyTicketRpcRow[]
      )[0]!
        .ticket_id as string;
      expect(typeof createdTicketId).toBe("string");
      expect(createdTicketId.length).toBeGreaterThan(10);
      expectRpcBusinessErrorCode(failures[0]!, "INSUFFICIENT_TOKENS");

      const { data: tickets, error: ticketsErr } = await admin
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("lottery_id", lottery.id);

      expect(ticketsErr).toBeNull();
      expect(tickets).toHaveLength(1);
      expect(tickets![0]!.id).toBe(createdTicketId);

      const { data: debitTxRows, error: debitTxErr } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", testUser.userId)
        .eq("transaction_type", "ticket_purchase");

      expect(debitTxErr).toBeNull();
      expect(debitTxRows).toHaveLength(1);
      expect(debitTxRows![0]!.direction).toBe("debit");
      expect(debitTxRows![0]!.reference_type).toBe("lottery_ticket");
      expect(debitTxRows![0]!.reference_id).toBe(createdTicketId);

      // Balance should be 0 after the single successful debit.
      const { data: balanceRow, error: balanceErr } = await admin
        .from("user_wallet_balance")
        .select("*")
        .eq("user_id", testUser.userId)
        .single();

      expect(balanceErr).toBeNull();
      expect(balanceRow?.balance).toBe(0);
    });
  });
});
