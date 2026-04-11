import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  createMissionCompletion,
  createTestUser,
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";

const ADMIN_GET_MISSIONS = "admin_get_missions";
const ADMIN_GET_MISSIONS_COUNT = "admin_get_missions_count";
const ADMIN_GET_MISSION_DETAIL = "admin_get_mission_detail";

type RpcFn = (
  name: string,
  args?: Record<string, unknown>,
) => ReturnType<ReturnType<typeof getSupabaseAnonClient>["rpc"]>;

function rpcBound(
  client: ReturnType<typeof getSupabaseAnonClient>,
): RpcFn {
  return client.rpc.bind(client) as RpcFn;
}

describe("admin mission read RPCs (integration)", () => {
  describe("security", () => {
    it("rejects unauthenticated callers for admin_get_missions", async () => {
      const anon = getSupabaseAnonClient();
      const { error } = await rpcBound(anon)(ADMIN_GET_MISSIONS, {});

      expect(error).not.toBeNull();
    });

    it("rejects unauthenticated callers for admin_get_missions_count", async () => {
      const anon = getSupabaseAnonClient();
      const { error } = await rpcBound(anon)(ADMIN_GET_MISSIONS_COUNT, {});

      expect(error).not.toBeNull();
    });

    it("rejects unauthenticated callers for admin_get_mission_detail", async () => {
      const anon = getSupabaseAnonClient();
      const randomId = crypto.randomUUID();
      const { error } = await rpcBound(anon)(ADMIN_GET_MISSION_DETAIL, {
        p_mission_id: randomId,
      });

      expect(error).not.toBeNull();
    });

    it("rejects non-admin authenticated user for admin_get_missions", async () => {
      const user = await createAuthenticatedTestUser();
      const { error } = await rpcBound(user.client)(ADMIN_GET_MISSIONS, {});

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
    });

    it("rejects non-admin authenticated user for admin_get_missions_count", async () => {
      const user = await createAuthenticatedTestUser();
      const { error } = await rpcBound(user.client)(ADMIN_GET_MISSIONS_COUNT, {});

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
    });

    it("rejects non-admin authenticated user for admin_get_mission_detail", async () => {
      const user = await createAuthenticatedTestUser();
      const randomId = crypto.randomUUID();
      const { error } = await rpcBound(user.client)(ADMIN_GET_MISSION_DETAIL, {
        p_mission_id: randomId,
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_ADMIN_REQUIRED/i);
    });
  });

  describe("admin_get_mission_detail validation", () => {
    it("rejects null mission id for admin_get_mission_detail", async () => {
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { error } = await rpcBound(adminUser.client)(ADMIN_GET_MISSION_DETAIL, {
        p_mission_id: null,
      });

      expect(error).not.toBeNull();
      expect(String(error?.message ?? "")).toMatch(/WINLAB_INVALID_MISSION_ID/i);
    });
  });

  describe("happy path (admin)", () => {
    it("returns paginated missions and matching count with filters", async () => {
      const uniqueId = `${Date.now()}-${Math.random()}`;
      const brand = await createBrand({ name: `brand-mission-${uniqueId}` });

      await createMission({
        brand_id: brand.id,
        title: `Zebra mission ${uniqueId}`,
        status: "active",
      });
      await createMission({
        brand_id: brand.id,
        title: `Alpha mission ${uniqueId}`,
        status: "draft",
      });
      const token = `TOK-${uniqueId}`;
      await createMission({
        brand_id: brand.id,
        title: `Search ${token} match`,
        status: "active",
      });

      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);
      const rpc = rpcBound(adminUser.client);

      const { data: countAll, error: countAllErr } = await rpc(
        ADMIN_GET_MISSIONS_COUNT,
        { p_brand_id: brand.id },
      );
      expect(countAllErr).toBeNull();
      expect(Number(countAll)).toBe(3);

      const { data: countDraft, error: countDraftErr } = await rpc(
        ADMIN_GET_MISSIONS_COUNT,
        { p_brand_id: brand.id, p_status: "draft" },
      );
      expect(countDraftErr).toBeNull();
      expect(Number(countDraft)).toBe(1);

      const { data: countSearch, error: countSearchErr } = await rpc(
        ADMIN_GET_MISSIONS_COUNT,
        { p_title_search: token },
      );
      expect(countSearchErr).toBeNull();
      expect(Number(countSearch)).toBe(1);

      const { data: page1, error: page1Err } = await rpc(ADMIN_GET_MISSIONS, {
        p_brand_id: brand.id,
        p_limit: 2,
        p_offset: 0,
        p_sort: "title_asc",
      });
      expect(page1Err).toBeNull();
      const rows1 = (page1 ?? []) as unknown as {
        mission_id: string;
        title: string;
      }[];
      expect(rows1).toHaveLength(2);
      expect(rows1[0]?.title.includes("Alpha")).toBe(true);

      const { data: page2, error: page2Err } = await rpc(ADMIN_GET_MISSIONS, {
        p_brand_id: brand.id,
        p_limit: 2,
        p_offset: 2,
        p_sort: "title_asc",
      });
      expect(page2Err).toBeNull();
      expect(((page2 ?? []) as unknown) as unknown[]).toHaveLength(1);

      const admin = getSupabaseAdminClient();
      const { count: dbCount, error: dbErr } = await admin
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brand.id);
      expect(dbErr).toBeNull();
      expect(dbCount).toBe(3);
    });

    it("returns mission detail with aggregates and completers without metadata", async () => {
      const uniqueId = `${Date.now()}-${Math.random()}`;
      const brand = await createBrand({ name: `brand-detail-${uniqueId}` });
      const mission = await createMission({
        brand_id: brand.id,
        title: `Detail mission ${uniqueId}`,
        validation_mode: "manual",
      });

      const completer1 = await createTestUser();
      const completer2 = await createTestUser();

      await createMissionCompletion({
        mission_id: mission.id,
        user_id: completer1.userId,
        status: "pending",
      });
      await createMissionCompletion({
        mission_id: mission.id,
        user_id: completer2.userId,
        status: "rejected",
      });

      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const { data: detailRows, error: detailErr } = await rpcBound(
        adminUser.client,
      )(ADMIN_GET_MISSION_DETAIL, { p_mission_id: mission.id });
      expect(detailErr).toBeNull();

      const detail = (Array.isArray(detailRows) ? detailRows[0] : detailRows) as Record<
        string,
        unknown
      >;
      expect(detail?.mission_id).toBe(mission.id);
      expect(detail?.title).toBe(mission.title);
      expect(detail?.total_completions).toBe(2);
      expect(detail?.pending_completions).toBe(1);
      expect(detail?.rejected_completions).toBe(1);
      expect(detail?.approved_completions).toBe(0);
      expect(detail?.metadata).toBeUndefined();
      expect(detail?.proof_data).toBeUndefined();

      const users = detail?.completed_users as { user_id: string; username: string }[];
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(2);
      const ids = new Set(users.map((u) => u.user_id));
      expect(ids.has(completer1.userId)).toBe(true);
      expect(ids.has(completer2.userId)).toBe(true);
      const names = users.map((u) => u.username).sort();

      const admin = getSupabaseAdminClient();
      const { data: p1 } = await admin
        .from("profiles")
        .select("username")
        .eq("id", completer1.userId)
        .single();
      const { data: p2 } = await admin
        .from("profiles")
        .select("username")
        .eq("id", completer2.userId)
        .single();
      expect(names).toEqual(
        [p1?.username, p2?.username].sort((a, b) =>
          String(a).localeCompare(String(b)),
        ),
      );
    });

    it("returns empty detail set for unknown mission id", async () => {
      const adminUser = await createAuthenticatedTestUser();
      await setProfileIsAdmin(adminUser.userId, true);

      const unknownId = crypto.randomUUID();
      const { data: detailRows, error: detailErr } = await rpcBound(
        adminUser.client,
      )(ADMIN_GET_MISSION_DETAIL, { p_mission_id: unknownId });
      expect(detailErr).toBeNull();
      expect((detailRows ?? []) as unknown[]).toHaveLength(0);
    });
  });
});
