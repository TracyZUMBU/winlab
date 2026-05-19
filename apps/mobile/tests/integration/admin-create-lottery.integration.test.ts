import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";

const ADMIN_CREATE_LOTTERY = "admin_create_lottery";

type RpcFn = (
  name: string,
  args?: Record<string, unknown>,
) => ReturnType<ReturnType<typeof getSupabaseAnonClient>["rpc"]>;

function rpcBound(
  client: ReturnType<typeof getSupabaseAnonClient>,
): RpcFn {
  return client.rpc.bind(client) as RpcFn;
}

type CreateLotteryRpcResult = {
  lottery_id?: string;
  slug?: string;
};

function futureLotteryDates() {
  const startsAt = new Date(Date.now() + 60_000);
  const endsAt = new Date(startsAt.getTime() + 21 * 24 * 60 * 60 * 1000);
  const drawAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_draw_at: drawAt.toISOString(),
  };
}

function baseCreatePayload(brandId: string, title: string) {
  return {
    p_brand_id: brandId,
    p_title: title,
    p_ticket_cost: 50,
    p_number_of_winners: 1,
    ...futureLotteryDates(),
    p_status: "draft",
  };
}

/** Alphanumeric suffix only — matches admin_lottery_slug_from_title sanitization. */
function uniqueTestId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

describe("admin_create_lottery RPC (integration)", () => {
  describe("security", () => {
    it("rejects unauthenticated callers", async () => {
      const brand = await createBrand();
      const anon = getSupabaseAnonClient();
      const { error } = await rpcBound(anon)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, "Loterie test anon"),
      });

      expect(error).not.toBeNull();
    });

    it("rejects non-admin authenticated users", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-create-lottery-${uniqueId}` });
      const user = await createAuthenticatedTestUser();
      await setProfileIsAdmin(user.userId, false);

      const { error } = await rpcBound(user.client)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, `Loterie non-admin ${uniqueId}`),
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
    });
  });

  describe("validation", () => {
    it("rejects empty title", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-empty-title-${uniqueId}` });
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { error } = await rpcBound(adminUser.client)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, "   "),
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_INVALID_TITLE/i);
    });

    it("rejects invalid date ordering", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-bad-dates-${uniqueId}` });
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const drawAt = new Date(endsAt.getTime() - 60_000);

      const { error } = await rpcBound(adminUser.client)(ADMIN_CREATE_LOTTERY, {
        p_brand_id: brand.id,
        p_title: `Loterie dates invalides ${uniqueId}`,
        p_ticket_cost: 50,
        p_number_of_winners: 1,
        p_ends_at: endsAt.toISOString(),
        p_draw_at: drawAt.toISOString(),
        p_status: "draft",
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_INVALID_LOTTERY_DATES/i);
    });

    it("rejects cancelled status at creation", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-cancelled-${uniqueId}` });
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { error } = await rpcBound(adminUser.client)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, `Loterie cancelled ${uniqueId}`),
        p_status: "cancelled",
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_INVALID_LOTTERY_STATUS/i);
    });
  });

  describe("happy path (admin)", () => {
    it("creates a lottery row with slug derived from title", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-happy-${uniqueId}` });
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const title = `Loterie Admin Create ${uniqueId}`;
      const { data, error } = await rpcBound(adminUser.client)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, title),
        p_description: "Description test",
        p_short_description: "Résumé court",
        p_category: "beauty",
        p_ticket_cost: 50,
        p_is_featured: false,
      });

      expect(error).toBeNull();
      const payload = data as CreateLotteryRpcResult | null;
      expect(typeof payload?.lottery_id).toBe("string");
      expect(payload?.slug).toMatch(new RegExp(`loterie-admin-create-${uniqueId}`, "i"));

      const admin = getSupabaseAdminClient();
      const { data: row, error: fetchError } = await admin
        .from("lotteries")
        .select(
          "id, brand_id, title, slug, status, ticket_cost, number_of_winners, description, short_description, category, is_featured",
        )
        .eq("id", payload!.lottery_id!)
        .single();

      expect(fetchError).toBeNull();
      expect(row).toEqual(
        expect.objectContaining({
          brand_id: brand.id,
          title,
          slug: payload?.slug,
          status: "draft",
          ticket_cost: 50,
          number_of_winners: 1,
          description: "Description test",
          short_description: "Résumé court",
          category: "beauty",
          is_featured: false,
        }),
      );
    });

    it("appends -2 slug suffix when base slug already exists", async () => {
      const uniqueId = uniqueTestId();
      const brand = await createBrand({ name: `brand-slug-collision-${uniqueId}` });
      const sharedTitle = `Loterie Collision ${uniqueId}`;
      const baseSlug = `loterie-collision-${uniqueId}`;

      await createLottery({
        brand_id: brand.id,
        title: "Existing lottery",
        slug: baseSlug,
      });

      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { data, error } = await rpcBound(adminUser.client)(ADMIN_CREATE_LOTTERY, {
        ...baseCreatePayload(brand.id, sharedTitle),
      });

      expect(error).toBeNull();
      const payload = data as CreateLotteryRpcResult | null;
      expect(payload?.slug).toBe(`${baseSlug}-2`);

      const admin = getSupabaseAdminClient();
      const { data: row } = await admin
        .from("lotteries")
        .select("slug")
        .eq("id", payload!.lottery_id!)
        .single();

      expect(row?.slug).toBe(`${baseSlug}-2`);
    });
  });
});
