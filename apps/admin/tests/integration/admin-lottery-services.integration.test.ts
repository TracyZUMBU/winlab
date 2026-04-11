/// <reference types="jest" />

import { getAdminLotteries } from "../../src/features/lotteries/services/getAdminLotteries";
import { getAdminLotteryDetail } from "../../src/features/lotteries/services/getAdminLotteryDetail";
import { getSupabaseClient } from "../../src/lib/supabase";
import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";

type AuthedTestUser = Awaited<ReturnType<typeof createAuthenticatedTestUser>>;

async function syncAppClientSession(authenticatedClient: AuthedTestUser["client"]) {
  const {
    data: { session },
  } = await authenticatedClient.auth.getSession();
  if (!session) {
    throw new Error("Expected authenticated session for integration test");
  }
  await getSupabaseClient().auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

describe("admin lottery services (integration)", () => {
  it("returns the seeded lottery in list and detail for an admin user", async () => {
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "active",
    });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const listResult = await getAdminLotteries();
    expect(listResult.success).toBe(true);
    expect(listResult.success ? listResult.data : []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lottery_id: lottery.id }),
      ]),
    );

    const detailResult = await getAdminLotteryDetail(lottery.id);
    expect(detailResult.success).toBe(true);
    expect(detailResult.success ? detailResult.data : null).toEqual(
      expect.objectContaining({
        lottery_id: lottery.id,
        title: lottery.title,
        status: "active",
        winners: expect.any(Array),
      }),
    );
  });

  it("rejects non-admin users for list and detail", async () => {
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "active",
    });

    const user = await createAuthenticatedTestUser();
    await setProfileIsAdmin(user.userId, false);
    await syncAppClientSession(user.client);

    const listResult = await getAdminLotteries();
    expect(listResult.success).toBe(false);

    const detailResult = await getAdminLotteryDetail(lottery.id);
    expect(detailResult.success).toBe(false);
  });
});
