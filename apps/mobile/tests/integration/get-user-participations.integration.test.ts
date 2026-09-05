import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  createLotteryTicket,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const RPC = "get_user_participations";

type ParticipationRow = {
  lottery_id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  status: string;
  user_tickets_count: number;
  last_participated_at: string;
};

describe("get_user_participations RPC (integration)", () => {
  it("returns participations ordered by most recent purchase with total ticket counts", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-part-${uniqueId}` });
    const user = await createAuthenticatedTestUser();
    const otherUser = await createAuthenticatedTestUser();

    const olderLottery = await createLottery({
      brand_id: brand.id,
      status: "active",
      title: `Older participation ${uniqueId}`,
    });
    const newerLottery = await createLottery({
      brand_id: brand.id,
      status: "drawn",
      title: `Newer participation ${uniqueId}`,
    });
    const cancelledLottery = await createLottery({
      brand_id: brand.id,
      status: "cancelled",
      title: `Cancelled participation ${uniqueId}`,
    });

    const olderPurchase = new Date(Date.now() - 120_000).toISOString();
    const newerPurchase = new Date(Date.now() - 30_000).toISOString();
    const cancelledPurchase = new Date(Date.now() - 60_000).toISOString();

    await createLotteryTicket({
      lottery_id: olderLottery.id,
      user_id: user.userId,
      status: "active",
      purchased_at: olderPurchase,
    });
    await createLotteryTicket({
      lottery_id: olderLottery.id,
      user_id: user.userId,
      status: "cancelled",
      purchased_at: olderPurchase,
    });
    await createLotteryTicket({
      lottery_id: newerLottery.id,
      user_id: user.userId,
      status: "active",
      purchased_at: newerPurchase,
    });
    await createLotteryTicket({
      lottery_id: cancelledLottery.id,
      user_id: user.userId,
      status: "active",
      purchased_at: cancelledPurchase,
    });
    await createLotteryTicket({
      lottery_id: newerLottery.id,
      user_id: otherUser.userId,
      status: "active",
      purchased_at: newerPurchase,
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_limit: 50,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as ParticipationRow[];
    const ownIds = new Set(
      rows
        .filter((row) =>
          [olderLottery.id, newerLottery.id, cancelledLottery.id].includes(
            row.lottery_id,
          ),
        )
        .map((row) => row.lottery_id),
    );

    expect(ownIds.has(olderLottery.id)).toBe(true);
    expect(ownIds.has(newerLottery.id)).toBe(true);
    expect(ownIds.has(cancelledLottery.id)).toBe(true);

    const scoped = rows.filter((row) => ownIds.has(row.lottery_id));
    expect(scoped.map((row) => row.lottery_id)).toEqual([
      newerLottery.id,
      cancelledLottery.id,
      olderLottery.id,
    ]);

    const olderRow = scoped.find((row) => row.lottery_id === olderLottery.id);
    expect(olderRow?.user_tickets_count).toBe(2);
    expect(olderRow?.status).toBe("active");

    const newerRow = scoped.find((row) => row.lottery_id === newerLottery.id);
    expect(newerRow?.user_tickets_count).toBe(1);
    expect(newerRow?.status).toBe("drawn");

    const cancelledRow = scoped.find(
      (row) => row.lottery_id === cancelledLottery.id,
    );
    expect(cancelledRow?.user_tickets_count).toBe(1);
    expect(cancelledRow?.status).toBe("cancelled");

    const admin = getSupabaseAdminClient();
    const { count: userTicketCount, error: countError } = await admin
      .from("lottery_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("lottery_id", olderLottery.id);

    expect(countError).toBeNull();
    expect(userTicketCount).toBe(2);
  });

  it("paginates with limit/offset and isolates other users", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-part-page-${uniqueId}` });
    const user = await createAuthenticatedTestUser();
    const otherUser = await createAuthenticatedTestUser();

    const lotteryA = await createLottery({
      brand_id: brand.id,
      status: "active",
      title: `Page A ${uniqueId}`,
    });
    const lotteryB = await createLottery({
      brand_id: brand.id,
      status: "active",
      title: `Page B ${uniqueId}`,
    });

    await createLotteryTicket({
      lottery_id: lotteryA.id,
      user_id: user.userId,
      status: "active",
      purchased_at: new Date(Date.now() - 10_000).toISOString(),
    });
    await createLotteryTicket({
      lottery_id: lotteryB.id,
      user_id: user.userId,
      status: "active",
      purchased_at: new Date(Date.now() - 5_000).toISOString(),
    });
    await createLotteryTicket({
      lottery_id: lotteryA.id,
      user_id: otherUser.userId,
      status: "active",
    });

    const firstPage = await user.client.rpc(RPC, {
      p_limit: 1,
      p_offset: 0,
    });
    expect(firstPage.error).toBeNull();
    const firstRows = (firstPage.data ?? []) as ParticipationRow[];
    expect(firstRows).toHaveLength(1);
    expect(firstRows[0]?.lottery_id).toBe(lotteryB.id);

    const secondPage = await user.client.rpc(RPC, {
      p_limit: 1,
      p_offset: 1,
    });
    expect(secondPage.error).toBeNull();
    const secondRows = (secondPage.data ?? []) as ParticipationRow[];
    expect(secondRows).toHaveLength(1);
    expect(secondRows[0]?.lottery_id).toBe(lotteryA.id);

    const otherResult = await otherUser.client.rpc(RPC, {
      p_limit: 50,
      p_offset: 0,
    });
    expect(otherResult.error).toBeNull();
    const otherRows = (otherResult.data ?? []) as ParticipationRow[];
    expect(
      otherRows.some((row) => row.lottery_id === lotteryB.id),
    ).toBe(false);
    expect(
      otherRows.some((row) => row.lottery_id === lotteryA.id),
    ).toBe(true);
    expect(
      otherRows.find((row) => row.lottery_id === lotteryA.id)?.user_tickets_count,
    ).toBe(1);
  });

  it("rejects invalid pagination args", async () => {
    const user = await createAuthenticatedTestUser();

    const badLimit = await user.client.rpc(RPC, {
      p_limit: 0,
      p_offset: 0,
    });
    expect(badLimit.error).not.toBeNull();

    const badOffset = await user.client.rpc(RPC, {
      p_limit: 10,
      p_offset: -1,
    });
    expect(badOffset.error).not.toBeNull();
  });
});
