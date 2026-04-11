import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  createLotteryTickets,
  getSupabaseAnonClient,
} from "@winlab/supabase-test-utils";

const GET_LOTTERY_ACTIVE_TICKET_COUNTS_RPC = "get_lottery_active_ticket_counts";

describe("get_lottery_active_ticket_counts RPC (integration)", () => {
  describe("counting logic", () => {
    it("returns active tickets count per lottery id", async () => {
      const brand = await createBrand();

      const lotteryA = await createLottery({
        brand_id: brand.id,
        status: "active",
      });
      const lotteryB = await createLottery({
        brand_id: brand.id,
        status: "active",
      });
      const lotteryC = await createLottery({
        brand_id: brand.id,
        status: "active",
      });

      const user1 = await createAuthenticatedTestUser();
      const user2 = await createAuthenticatedTestUser();
      const user3 = await createAuthenticatedTestUser();

      await createLotteryTickets([
        { lottery_id: lotteryA.id, user_id: user1.userId, status: "active" },
        { lottery_id: lotteryA.id, user_id: user2.userId, status: "active" },
        { lottery_id: lotteryA.id, user_id: user3.userId, status: "cancelled" },
        { lottery_id: lotteryB.id, user_id: user1.userId, status: "active" },
        { lottery_id: lotteryB.id, user_id: user2.userId, status: "cancelled" },
      ]);

      const caller = await createAuthenticatedTestUser();

      const { data, error } = await caller.client.rpc(
        GET_LOTTERY_ACTIVE_TICKET_COUNTS_RPC,
        {
          p_lottery_ids: [lotteryA.id, lotteryB.id, lotteryC.id],
        },
      );

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      const byLotteryId = new Map(
        (data ?? []).map((row) => [row.lottery_id, row.active_tickets_count]),
      );

      expect(byLotteryId.get(lotteryA.id)).toBe(2);
      expect(byLotteryId.get(lotteryB.id)).toBe(1);
      expect(byLotteryId.get(lotteryC.id)).toBe(0);
    });

    it("deduplicates input lottery ids and still returns one row per lottery", async () => {
      const brand = await createBrand();
      const lottery = await createLottery({
        brand_id: brand.id,
        status: "active",
      });

      const ticketOwner = await createAuthenticatedTestUser();
      await createLotteryTickets([
        {
          lottery_id: lottery.id,
          user_id: ticketOwner.userId,
          status: "active",
        },
      ]);

      const caller = await createAuthenticatedTestUser();
      const { data, error } = await caller.client.rpc(
        GET_LOTTERY_ACTIVE_TICKET_COUNTS_RPC,
        {
          p_lottery_ids: [lottery.id, lottery.id, lottery.id],
        },
      );

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.lottery_id).toBe(lottery.id);
      expect(data?.[0]?.active_tickets_count).toBe(1);
    });
  });

  describe("security", () => {
    it("anon (not authenticated) cannot call RPC", async () => {
      const anon = getSupabaseAnonClient();

      const { data, error } = await anon.rpc(
        GET_LOTTERY_ACTIVE_TICKET_COUNTS_RPC,
        {
          p_lottery_ids: [],
        },
      );

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.message ?? "").toContain("UNAUTHENTICATED");
    });
  });
});
