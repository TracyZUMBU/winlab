/// <reference types="jest" />

import {
  createAuthenticatedTestUser,
  createBrand,
  getSupabaseAdminClient,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";
import {
  createAdminLottery,
  getActiveBrandsForLotteryForm,
  getLotteryCategoryOptions,
  resolveDefaultLotteryBrandId,
} from "../../src/features/lotteries";
import { getSupabaseClient } from "../../src/lib/supabase";

type AuthedTestUser = Awaited<ReturnType<typeof createAuthenticatedTestUser>>;

async function syncAppClientSession(
  authenticatedClient: AuthedTestUser["client"],
) {
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

function futureLotteryDates() {
  const startsAt = new Date(Date.now() + 60_000);
  const endsAt = new Date(startsAt.getTime() + 21 * 24 * 60 * 60 * 1000);
  const drawAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    draw_at: drawAt.toISOString(),
  };
}

describe("admin lottery create services (integration)", () => {
  it("loads active brands and predefined categories for an admin user", async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const brand = await createBrand({
      name: `Brand categories ${uniqueId}`,
      slug: `brand-cat-${uniqueId}`,
    });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const brandsResult = await getActiveBrandsForLotteryForm();
    expect(brandsResult.success).toBe(true);
    expect(brandsResult.success ? brandsResult.data : []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: brand.id, slug: brand.slug }),
      ]),
    );

    const categoriesResult = await getLotteryCategoryOptions();
    expect(categoriesResult.success).toBe(true);
    expect(categoriesResult.success ? categoriesResult.data : []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "entertainment",
          label: "Divertissement",
        }),
        expect.objectContaining({ id: "animal", label: "Animal" }),
        expect.objectContaining({ id: "mode", label: "Mode" }),
        expect.objectContaining({ id: "tech", label: "Tech" }),
        expect.objectContaining({ id: "restaurant", label: "Restaurant" }),
        expect.objectContaining({ id: "food", label: "Alimentation" }),
        expect.objectContaining({ id: "sports", label: "Sports" }),
        expect.objectContaining({ id: "wellness", label: "Bien-être" }),
        expect.objectContaining({ id: "beauty", label: "Beauté" }),
        expect.objectContaining({ id: "travel", label: "Voyage" }),
        expect.objectContaining({ id: "kid", label: "Enfants" }),
        expect.objectContaining({ id: "unknown", label: "Inconnu" }),
      ]),
    );
  });

  it("resolves default brand by slug winlab when env id is unset", async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const winlab = await createBrand({
      name: `Wintix ${uniqueId}`,
      slug: "winlab",
    });
    const other = await createBrand({
      name: `Other ${uniqueId}`,
      slug: `other-${uniqueId}`,
    });

    const defaultId = resolveDefaultLotteryBrandId([
      { id: other.id, name: other.name, slug: other.slug },
      { id: winlab.id, name: winlab.name, slug: winlab.slug },
    ]);

    expect(defaultId).toBe(winlab.id);
  });

  it("creates a draft lottery via createAdminLottery for an admin user", async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const brand = await createBrand({ name: `brand-create-svc-${uniqueId}` });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const dates = futureLotteryDates();
    const title = `Loterie service ${uniqueId}`;
    const createResult = await createAdminLottery({
      brand_id: brand.id,
      title,
      category: "tech",
      ticket_cost: 50,
      number_of_winners: 1,
      status: "draft",
      ...dates,
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) {
      return;
    }

    const admin = getSupabaseAdminClient();
    const { data: row, error } = await admin
      .from("lotteries")
      .select("id, title, status, slug, brand_id")
      .eq("id", createResult.data.id)
      .single();

    expect(error).toBeNull();
    expect(row).toEqual(
      expect.objectContaining({
        title,
        status: "draft",
        brand_id: brand.id,
        slug: createResult.data.slug,
      }),
    );
  });

  it("rejects non-admin users for createAdminLottery", async () => {
    const brand = await createBrand();
    const user = await createAuthenticatedTestUser();
    await setProfileIsAdmin(user.userId, false);
    await syncAppClientSession(user.client);

    const dates = futureLotteryDates();
    const createResult = await createAdminLottery({
      brand_id: brand.id,
      title: "Loterie interdite",
      category: "mode",
      ticket_cost: 50,
      number_of_winners: 1,
      status: "draft",
      ...dates,
    });

    expect(createResult.success).toBe(false);
    if (createResult.success) {
      return;
    }
    expect(createResult.errorCode).toBe("UNAUTHORIZED");
  });
});
