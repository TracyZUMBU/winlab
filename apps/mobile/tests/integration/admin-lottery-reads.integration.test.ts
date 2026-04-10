import { createAuthenticatedTestUser } from "../factories/auth";
import { createBrand } from "../factories/brands";
import { createLottery } from "../factories/lotteries";
import { setProfileIsAdmin } from "../factories/profiles";
import { getSupabaseAnonClient } from "../utils/supabaseTestClient";

const ADMIN_GET_LOTTERIES = "admin_get_lotteries";
const ADMIN_GET_LOTTERY_DETAIL = "admin_get_lottery_detail";

describe("admin lottery read RPCs (integration)", () => {
  describe("security", () => {
    it("rejects unauthenticated callers for admin_get_lotteries", async () => {
      const anon = getSupabaseAnonClient();
      const { error } = await anon.rpc(ADMIN_GET_LOTTERIES);

      expect(error).not.toBeNull();
    });

    it("rejects non-admin authenticated user for admin_get_lotteries", async () => {
      const user = await createAuthenticatedTestUser();
      const { error } = await user.client.rpc(ADMIN_GET_LOTTERIES);

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
    });
  });

  describe("happy path (admin)", () => {
    it("returns the created lottery in list and detail", async () => {
      const brand = await createBrand();
      const lottery = await createLottery({
        brand_id: brand.id,
        status: "active",
      });

      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { data: list, error: listError } = await adminUser.client.rpc(
        ADMIN_GET_LOTTERIES,
      );
      expect(listError).toBeNull();
      expect(Array.isArray(list)).toBe(true);
      const ids = new Set((list ?? []).map((row: { lottery_id: string }) => row.lottery_id));
      expect(ids.has(lottery.id)).toBe(true);

      const { data: detailRows, error: detailError } =
        await adminUser.client.rpc(ADMIN_GET_LOTTERY_DETAIL, {
          p_lottery_id: lottery.id,
        });
      expect(detailError).toBeNull();
      const detail = Array.isArray(detailRows) ? detailRows[0] : detailRows;
      expect(detail?.lottery_id).toBe(lottery.id);
      expect(detail?.title).toBe(lottery.title);
      expect(Array.isArray(detail?.winners)).toBe(true);
    });
  });
});
