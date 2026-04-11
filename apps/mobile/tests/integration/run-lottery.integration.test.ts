import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  createLotteryTickets,
  createLotteryWinner,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
} from "@winlab/supabase-test-utils";

// Note: `run_lottery` may not yet be present in generated `supabase.types.ts`
// until `supabase gen types` is re-run, so we cast to `any` to keep tests compiling.
const RUN_LOTTERY_RPC = "run_lottery" as any;

const expectRpcErrorContains = (
  result: { data: unknown; error: any },
  expectedSubstring: string,
) => {
  expect(result.error).toBeTruthy();
  expect(result.error?.message ?? "").toContain(expectedSubstring);
};

const expectAnyRpcErrorContains = (
  result: { data: unknown; error: any },
  expectedSubstrings: string[],
) => {
  expect(result.error).toBeTruthy();
  const msg = result.error?.message ?? "";
  expect(expectedSubstrings.some((s) => msg.includes(s))).toBeTruthy();
};

const getLottery = async (
  admin: ReturnType<typeof getSupabaseAdminClient>,
  lotteryId: string,
) => {
  const { data, error } = await admin
    .from("lotteries")
    .select("id,status,draw_at,ends_at,number_of_winners,updated_at")
    .eq("id", lotteryId)
    .single();
  if (error) throw error;
  return data;
};

describe("run_lottery RPC (integration)", () => {
  describe("cas nominal", () => {
    it("0 active ticket -> status drawn and returns []", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
        number_of_winners: 3,
      });

      const lotteryBefore = await getLottery(admin, lottery.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();

      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual([]);

      const after = await getLottery(admin, lottery.id);
      expect(after.status).toBe("drawn");
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(lotteryBefore.updated_at).getTime(),
      );

      const { data: winnersRows, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("id")
        .eq("lottery_id", lottery.id);
      expect(winnersErr).toBeNull();
      expect(winnersRows).toHaveLength(0);
    });

    it("1 active ticket & winners=1 -> creates 1 winner and returns [ticket_id]", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const testUser = await createAuthenticatedTestUser();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
        number_of_winners: 1,
      });

      const ticketRows = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: testUser.userId,
          status: "active",
        },
      ]);
      expect(ticketRows).toHaveLength(1);
      const ticket = ticketRows[0]!;

      const before = await getLottery(admin, lottery.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();

      expect(data).toHaveLength(1);
      expect(data[0]).toBe(ticket.id);

      // winners table row
      const { data: winnersOrdered, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id,user_id,position")
        .eq("lottery_id", lottery.id)
        .order("position", { ascending: true });
      expect(winnersErr).toBeNull();
      if (!winnersOrdered) throw new Error("Expected lottery_winners rows");
      expect(winnersOrdered).toHaveLength(1);

      expect(winnersOrdered[0]?.ticket_id).toBe(ticket.id);
      expect(winnersOrdered[0]?.user_id).toBe(testUser.userId);
      expect(winnersOrdered[0]?.position).toBe(1);

      // returned ids match inserted ids (ordered by position)
      expect(data).toEqual([winnersOrdered[0]!.ticket_id]);

      const after = await getLottery(admin, lottery.id);
      expect(after.status).toBe("drawn");
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(before.updated_at).getTime(),
      );
    });

    it("3 active tickets & winners=2 -> creates 2 winners with positions 1..2", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all([
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
      ]);

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 20_000).toISOString(),
        draw_at: new Date(Date.now() - 10_000).toISOString(),
        number_of_winners: 2,
      });

      const tickets = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: users[0]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[1]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[2]!.userId,
          status: "active",
        },
      ]);
      const eligibleTicketIds = tickets.map((t) => t.id);

      const lotteryBefore = await getLottery(admin, lottery.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      // positions should start at 1 and have no holes
      const { data: winnersOrdered, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id,user_id,position")
        .eq("lottery_id", lottery.id)
        .order("position", { ascending: true });
      expect(winnersErr).toBeNull();
      if (!winnersOrdered) throw new Error("Expected lottery_winners rows");
      expect(winnersOrdered).toHaveLength(2);

      expect(winnersOrdered.map((w) => w.position)).toEqual([1, 2]);

      // returned ids correspond exactly to inserted winners (ordered)
      expect(data).toEqual(winnersOrdered.map((w) => w.ticket_id));

      // winners user_id correspond to ticket owner
      const { data: ticketRowsAgain, error: ticketRowsErr } = await admin
        .from("lottery_tickets")
        .select("id,user_id")
        .eq("lottery_id", lottery.id);
      expect(ticketRowsErr).toBeNull();

      const ticketById = new Map(
        ticketRowsAgain!.map((t) => [t.id, t.user_id]),
      );

      for (const w of winnersOrdered) {
        expect(ticketById.get(w.ticket_id)).toBe(w.user_id);
      }

      // returned ids are subset of eligible ticket ids
      for (const ticketId of data) {
        expect(eligibleTicketIds).toContain(ticketId);
      }

      const after = await getLottery(admin, lottery.id);
      expect(after.status).toBe("drawn");
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(lotteryBefore.updated_at).getTime(),
      );
    });

    it("3 active tickets & winners=1 -> creates 1 winner", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all([
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
      ]);

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 25_000).toISOString(),
        draw_at: new Date(Date.now() - 15_000).toISOString(),
        number_of_winners: 1,
      });

      const tickets = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: users[0]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[1]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[2]!.userId,
          status: "active",
        },
      ]);
      const eligibleTicketIds = tickets.map((t) => t.id);

      const lotteryBefore = await getLottery(admin, lottery.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);

      // Only 1 winner, and it must belong to eligible tickets.
      expect(eligibleTicketIds).toContain(data[0]);

      const after = await getLottery(admin, lottery.id);
      expect(after.status).toBe("drawn");
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(lotteryBefore.updated_at).getTime(),
      );
    });

    it("2 active tickets & winners=5 -> only 2 winners are created", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all([
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
      ]);

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 30_000).toISOString(),
        draw_at: new Date(Date.now() - 20_000).toISOString(),
        number_of_winners: 5,
      });

      const tickets = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: users[0]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[1]!.userId,
          status: "active",
        },
      ]);
      expect(tickets).toHaveLength(2);

      const lotteryBefore = await getLottery(admin, lottery.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      const { data: winnersOrdered, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id,position")
        .eq("lottery_id", lottery.id)
        .order("position", { ascending: true });

      // ensure ordering matches returned array (by position)
      if (winnersErr) throw winnersErr;
      if (!winnersOrdered) throw new Error("Expected lottery_winners rows");
      expect(winnersOrdered).toHaveLength(2);
      expect(winnersOrdered.map((w) => w.position)).toEqual([1, 2]);
      expect(winnersOrdered.map((w) => w.ticket_id)).toEqual(data);

      const after = await getLottery(admin, lottery.id);
      expect(after.status).toBe("drawn");
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(lotteryBefore.updated_at).getTime(),
      );
    });

    it("second call on same lottery fails with LOTTERY_ALREADY_DRAWN", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const testUser = await createAuthenticatedTestUser();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 15_000).toISOString(),
        draw_at: new Date(Date.now() - 9_000).toISOString(),
        number_of_winners: 1,
      });

      await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: testUser.userId,
          status: "active",
        },
      ]);

      const first = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(first.error).toBeNull();

      const second = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(second as any, "LOTTERY_ALREADY_DRAWN");
    });
  });

  describe("tickets eligibility (active only)", () => {
    it("cancelled tickets are never drawn", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const user1 = await createAuthenticatedTestUser();
      const user2 = await createAuthenticatedTestUser();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 20_000).toISOString(),
        draw_at: new Date(Date.now() - 10_000).toISOString(),
        number_of_winners: 1,
      });

      const [activeTicket] = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: user1.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: user2.userId,
          status: "cancelled",
        },
      ]);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0]).toBe(activeTicket.id);

      const { data: winners } = await admin
        .from("lottery_winners")
        .select("ticket_id")
        .eq("lottery_id", lottery.id);
      expect(winners).toHaveLength(1);
      expect(winners![0]?.ticket_id).toBe(activeTicket.id);
    });
  });

  describe("incoherent lottery_winners (exclusion of already-winning tickets)", () => {
    it("excludes tickets already in lottery_winners and draws only remaining eligible tickets", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all([
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
      ]);

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 40_000).toISOString(),
        draw_at: new Date(Date.now() - 20_000).toISOString(),
        number_of_winners: 2,
      });

      const tickets = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: users[0]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[1]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[2]!.userId,
          status: "active",
        },
      ]);

      // Create an existing (pre-drawn) winner row but with a position that
      // won't conflict with the function's positions (1..N).
      const preExistingWinner = await createLotteryWinner({
        lottery_id: lottery.id,
        ticket_id: tickets[0]!.id,
        user_id: users[0]!.userId,
        position: 99,
      });
      expect(preExistingWinner.ticket_id).toBe(tickets[0]!.id);

      const eligibleIds = tickets.slice(1).map((t) => t.id);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data).toEqual(expect.arrayContaining(eligibleIds));
      expect(data).not.toContain(preExistingWinner.ticket_id);

      // Ensure returned ids exist in lottery_winners
      const { data: winnersRows, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id")
        .eq("lottery_id", lottery.id);
      expect(winnersErr).toBeNull();

      const winnerIds = winnersRows!.map((w) => w.ticket_id);
      for (const id of data) {
        expect(winnerIds).toContain(id);
      }

      const lotteryAfter = await getLottery(admin, lottery.id);
      expect(lotteryAfter.status).toBe("drawn");
    });

    it("when all active tickets are already in lottery_winners -> returns [] and still marks lottery as drawn", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all([
        createAuthenticatedTestUser(),
        createAuthenticatedTestUser(),
      ]);

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 50_000).toISOString(),
        draw_at: new Date(Date.now() - 25_000).toISOString(),
        number_of_winners: 5,
      });

      const tickets = await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: users[0]!.userId,
          status: "active",
        },
        {
          lottery_id: lottery.id,
          user_id: users[1]!.userId,
          status: "active",
        },
      ]);

      // Mark both as winners already (positions 1 and 2) => no eligible ticket remains.
      await createLotteryWinner({
        lottery_id: lottery.id,
        ticket_id: tickets[0]!.id,
        user_id: users[0]!.userId,
        position: 1,
      });
      await createLotteryWinner({
        lottery_id: lottery.id,
        ticket_id: tickets[1]!.id,
        user_id: users[1]!.userId,
        position: 2,
      });

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toEqual([]);

      const lotteryAfter = await getLottery(admin, lottery.id);
      expect(lotteryAfter.status).toBe("drawn");

      const { data: winnersRows, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id")
        .eq("lottery_id", lottery.id);
      expect(winnersErr).toBeNull();
      expect(winnersRows).toHaveLength(2);
    });
  });

  describe("lottery validation errors", () => {
    it("loterie inexistante -> LOTTERY_NOT_FOUND", async () => {
      const admin = getSupabaseAdminClient();
      const nonExisting = "00000000-0000-0000-0000-000000000000";

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: nonExisting,
      });

      expectRpcErrorContains(result as any, "LOTTERY_NOT_FOUND");
    });

    it("loterie en draft -> LOTTERY_DRAFT", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "draft",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(result as any, "LOTTERY_DRAFT");
    });

    it("loterie cancelled -> LOTTERY_CANCELLED", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "cancelled",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(result as any, "LOTTERY_CANCELLED");
    });

    it("loterie déjà drawn -> LOTTERY_ALREADY_DRAWN", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "drawn",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(result as any, "LOTTERY_ALREADY_DRAWN");
    });

    it("loterie en active au lieu de closed -> LOTTERY_NOT_CLOSED", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "active",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(result as any, "LOTTERY_NOT_CLOSED");
    });

    it("closed mais draw_at dans le futur -> LOTTERY_DRAW_NOT_READY", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() + 10_000).toISOString(),
        number_of_winners: 1,
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectRpcErrorContains(result as any, "LOTTERY_DRAW_NOT_READY");
    });

    it("closed avec ends_at dans le futur -> erreur (souvent LOTTERY_DRAW_NOT_READY à cause des contraintes dates)", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      // Note: schema check requires ends_at <= draw_at. Therefore if ends_at is in the future,
      // draw_at must also be in the future => function will likely fail with LOTTERY_DRAW_NOT_READY first.
      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() + 10_000).toISOString(),
        draw_at: new Date(Date.now() + 20_000).toISOString(),
        number_of_winners: 1,
      });

      const result = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expectAnyRpcErrorContains(result as any, [
        "LOTTERY_NOT_ENDED",
        "LOTTERY_DRAW_NOT_READY",
      ]);
    });
  });

  describe("security (service_role only)", () => {
    it("an authenticated user cannot execute run_lottery", async () => {
      const testUser = await createAuthenticatedTestUser();
      const brand = await createBrand();
      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
        number_of_winners: 1,
      });

      const result = await testUser.client.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });

      expect(result.error).toBeTruthy();
      const msg = result.error?.message ?? "";
      // Postgres permission error text can vary; we only assert on the keyword.
      expect(msg.toLowerCase()).toContain("permission");
    });

    it("anon client cannot execute run_lottery", async () => {
      const anon = getSupabaseAnonClient();
      const brand = await createBrand();
      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 10_000).toISOString(),
        draw_at: new Date(Date.now() - 5_000).toISOString(),
        number_of_winners: 1,
      });

      const result = await anon.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });

      expect(result.error).toBeTruthy();
      const msg = result.error?.message ?? "";
      expect(msg.toLowerCase()).toContain("permission");
    });
  });

  describe("scalability (no duplicate winners)", () => {
    it("draws many winners without duplicating ticket_ids", async () => {
      const admin = getSupabaseAdminClient();
      const brand = await createBrand();

      const users = await Promise.all(
        Array.from({ length: 20 }).map(() => createAuthenticatedTestUser()),
      );

      const lottery = await createLottery({
        brand_id: brand.id,
        status: "closed",
        ends_at: new Date(Date.now() - 120_000).toISOString(),
        draw_at: new Date(Date.now() - 60_000).toISOString(),
        number_of_winners: 50,
      });

      // Create 200 active tickets distributed across 20 users.
      const ticketsPayload = Array.from({ length: 200 }).map((_, i) => ({
        lottery_id: lottery.id,
        user_id: users[i % users.length]!.userId,
        status: "active" as const,
      }));

      const tickets = await createLotteryTickets(ticketsPayload);
      expect(tickets).toHaveLength(200);

      const { data, error } = await admin.rpc(RUN_LOTTERY_RPC, {
        p_lottery_id: lottery.id,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(50);

      // No duplicates in returned ticket_ids (should also be enforced by DB constraint).
      const unique = new Set((data as string[]).map((x) => String(x)));
      expect(unique.size).toBe(50);

      const { data: winnersRows, error: winnersErr } = await admin
        .from("lottery_winners")
        .select("ticket_id,position")
        .eq("lottery_id", lottery.id);
      expect(winnersErr).toBeNull();
      expect(winnersRows).toHaveLength(50);

      // Returned ids must match exactly those inserted in lottery_winners (ordered by position).
      if (!winnersRows) throw new Error("Expected lottery_winners rows");
      const winnersOrderedByPosition = [...winnersRows].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      );
      expect(winnersOrderedByPosition.map((w) => w.ticket_id)).toEqual(data);

      const uniqueDb = new Set(
        winnersRows!.map((w) => String((w as any).ticket_id)),
      );
      expect(uniqueDb.size).toBe(50);
    });
  });
});
