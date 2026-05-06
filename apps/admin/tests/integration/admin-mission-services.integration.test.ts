/// <reference types="jest" />

import {
  createAdminMission,
  getAdminMissionDetail,
  getAdminMissions,
  getAdminMissionsCount,
} from "../../src/features/missions";
import { getSupabaseClient } from "../../src/lib/supabase";
import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  getSupabaseAdminClient,
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

describe("admin mission services (integration)", () => {
  it("returns the created mission in list, count and detail for an admin user", async () => {
    const brand = await createBrand();
    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
    });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const countResult = await getAdminMissionsCount({ brandId: brand.id });
    expect(countResult.success).toBe(true);
    expect(countResult.success ? countResult.data : 0).toBeGreaterThanOrEqual(1);

    const listResult = await getAdminMissions({
      brandId: brand.id,
      limit: 50,
      offset: 0,
      sort: "title_asc",
    });
    expect(listResult.success).toBe(true);
    expect(listResult.success ? listResult.data : []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mission_id: mission.id,
          title: mission.title,
          brand_id: brand.id,
        }),
      ]),
    );

    const detailResult = await getAdminMissionDetail(mission.id);
    expect(detailResult.success).toBe(true);
    expect(detailResult.success ? detailResult.data : null).toEqual(
      expect.objectContaining({
        mission_id: mission.id,
        title: mission.title,
        status: "active",
        completed_users: expect.any(Array),
      }),
    );
  });

  it("rejects non-admin users for list, count and detail", async () => {
    const brand = await createBrand();
    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
    });

    const user = await createAuthenticatedTestUser();
    await setProfileIsAdmin(user.userId, false);
    await syncAppClientSession(user.client);

    const listResult = await getAdminMissions({});
    expect(listResult.success).toBe(false);

    const countResult = await getAdminMissionsCount({});
    expect(countResult.success).toBe(false);

    const detailResult = await getAdminMissionDetail(mission.id);
    expect(detailResult.success).toBe(false);
  });

  it("creates a draft mission with rules_text for an admin user", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-create-${uniqueId}` });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const rulesText = `## Règlement\n\nCréation admin ${uniqueId}.`;
    const createResult = await createAdminMission({
      brand_id: brand.id,
      title: `Mission créée ${uniqueId}`,
      rules_text: rulesText,
      mission_type: "survey",
      token_reward: 15,
      validation_mode: "automatic",
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) {
      return;
    }

    const missionId = createResult.data.id;
    const admin = getSupabaseAdminClient();
    const { data: row, error } = await admin
      .from("missions")
      .select("id, status, rules_text, title")
      .eq("id", missionId)
      .single();
    expect(error).toBeNull();
    expect(row?.status).toBe("draft");
    expect(row?.rules_text).toBe(rulesText);
    expect(row?.title).toBe(`Mission créée ${uniqueId}`);
  });

  it("rejects create mission for non-admin (RLS)", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-forbid-${uniqueId}` });

    const user = await createAuthenticatedTestUser();
    await setProfileIsAdmin(user.userId, false);
    await syncAppClientSession(user.client);

    const createResult = await createAdminMission({
      brand_id: brand.id,
      title: `Tentative ${uniqueId}`,
      rules_text: "## R\n\nx",
      mission_type: "survey",
      token_reward: 10,
      validation_mode: "automatic",
    });

    expect(createResult.success).toBe(false);
    expect(createResult.success ? null : createResult.errorCode).toBe(
      "FORBIDDEN",
    );
  });

  it("returns INVALID_PAYLOAD when title is empty after trim", async () => {
    const brand = await createBrand();
    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);
    await syncAppClientSession(adminUser.client);

    const createResult = await createAdminMission({
      brand_id: brand.id,
      title: "   ",
      rules_text: "## R\n\nx",
      mission_type: "survey",
      token_reward: 10,
      validation_mode: "automatic",
    });

    expect(createResult.success).toBe(false);
    expect(createResult.success ? null : createResult.errorCode).toBe(
      "INVALID_PAYLOAD",
    );
  });
});
