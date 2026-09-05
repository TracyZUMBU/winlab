import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";

const RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE = "admin_dev_reset_lotteries_schedule";

function uniqueTestId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

describe("admin_dev_reset_lotteries_schedule RPC (integration)", () => {
  it("rejects unauthenticated callers", async () => {
    const anon = getSupabaseAnonClient();
    const { error } = await anon.rpc(RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE);

    expect(error).not.toBeNull();
  });

  it("rejects non-admin authenticated users", async () => {
    const user = await createAuthenticatedTestUser();
    await setProfileIsAdmin(user.userId, false);

    const { error } = await user.client.rpc(RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE);

    expect(error).not.toBeNull();
    expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
  });

  it("aligns status with ends_at and leaves drawn/cancelled untouched", async () => {
    const uniqueId = uniqueTestId();
    const admin = getSupabaseAdminClient();
    const brand = await createBrand({ name: `brand-dev-reset-${uniqueId}` });
    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);

    const pastEndsAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const pastDrawAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const closedLottery = await createLottery({
      brand_id: brand.id,
      title: `Loterie closed dev-reset ${uniqueId}`,
      status: "closed",
      ends_at: pastEndsAt,
      draw_at: pastDrawAt,
    });

    const drawnLottery = await createLottery({
      brand_id: brand.id,
      title: `Loterie drawn dev-reset ${uniqueId}`,
      status: "drawn",
      ends_at: pastEndsAt,
      draw_at: pastDrawAt,
    });

    const cancelledLottery = await createLottery({
      brand_id: brand.id,
      title: `Loterie cancelled dev-reset ${uniqueId}`,
      status: "cancelled",
      ends_at: pastEndsAt,
      draw_at: pastDrawAt,
    });

    const { data: updatedCount, error } = await adminUser.client.rpc(
      RPC_ADMIN_DEV_RESET_LOTTERIES_SCHEDULE,
    );

    expect(error).toBeNull();
    expect(updatedCount).toBeGreaterThanOrEqual(1);

    const { data: closedAfter, error: closedAfterError } = await admin
      .from("lotteries")
      .select("id, status, ends_at, draw_at, starts_at")
      .eq("id", closedLottery.id)
      .single();

    expect(closedAfterError).toBeNull();
    expect(closedAfter).not.toBeNull();
    expect(closedAfter!.ends_at).not.toBeNull();

    const endsAtMs = new Date(closedAfter!.ends_at!).getTime();
    const nowMs = Date.now();

    if (endsAtMs > nowMs) {
      expect(closedAfter!.status).toBe("active");
    } else {
      expect(closedAfter!.status).toBe("closed");
    }

    const { data: drawnAfter, error: drawnAfterError } = await admin
      .from("lotteries")
      .select("status, ends_at, draw_at")
      .eq("id", drawnLottery.id)
      .single();

    expect(drawnAfterError).toBeNull();
    expect(drawnAfter!.status).toBe("drawn");
    expect(new Date(drawnAfter!.ends_at!).getTime()).toBe(
      new Date(pastEndsAt).getTime(),
    );
    expect(new Date(drawnAfter!.draw_at).getTime()).toBe(
      new Date(pastDrawAt).getTime(),
    );

    const { data: cancelledAfter, error: cancelledAfterError } = await admin
      .from("lotteries")
      .select("status, ends_at, draw_at")
      .eq("id", cancelledLottery.id)
      .single();

    expect(cancelledAfterError).toBeNull();
    expect(cancelledAfter!.status).toBe("cancelled");
    expect(new Date(cancelledAfter!.ends_at!).getTime()).toBe(
      new Date(pastEndsAt).getTime(),
    );
    expect(new Date(cancelledAfter!.draw_at).getTime()).toBe(
      new Date(pastDrawAt).getTime(),
    );
  });
});
