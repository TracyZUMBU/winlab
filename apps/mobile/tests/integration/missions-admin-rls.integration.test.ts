import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  getSupabaseAdminClient,
  insertMissionWithUserClient,
  setProfileIsAdmin,
} from "@winlab/supabase-test-utils";

describe("missions admin RLS (integration)", () => {
  it("allows admin to insert a mission with rules_text", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-admin-ins-${uniqueId}` });
    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);

    const { data, error } = await insertMissionWithUserClient(adminUser.client, {
      brandId: brand.id,
      uniqueSuffix: uniqueId,
      rulesText: `## Règlement\n\nContenu admin ${uniqueId}.`,
    });

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();

    const admin = getSupabaseAdminClient();
    const { data: row, error: fetchErr } = await admin
      .from("missions")
      .select("id, title, status, rules_text")
      .eq("id", data!.id)
      .single();
    expect(fetchErr).toBeNull();
    expect(row?.status).toBe("draft");
    expect(String(row?.rules_text)).toContain("Contenu admin");
  });

  it("rejects insert for non-admin authenticated user", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-user-ins-${uniqueId}` });
    const user = await createAuthenticatedTestUser();

    const { data, error } = await insertMissionWithUserClient(user.client, {
      brandId: brand.id,
      uniqueSuffix: uniqueId,
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("allows admin to update a mission", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-admin-upd-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      title: `Titre avant ${uniqueId}`,
    });

    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);

    const newTitle = `Titre après ${uniqueId}`;
    const { error } = await adminUser.client
      .from("missions")
      .update({ title: newTitle })
      .eq("id", mission.id);

    expect(error).toBeNull();

    const admin = getSupabaseAdminClient();
    const { data: row } = await admin
      .from("missions")
      .select("title")
      .eq("id", mission.id)
      .single();
    expect(row?.title).toBe(newTitle);
  });

  it("rejects update for non-admin", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-user-upd-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      title: `Mission cible ${uniqueId}`,
    });

    const user = await createAuthenticatedTestUser();
    const { data: updatedRows, error } = await user.client
      .from("missions")
      .update({ title: "hack" })
      .eq("id", mission.id)
      .select("id");

    expect(error).toBeNull();
    expect(updatedRows ?? []).toEqual([]);

    const admin = getSupabaseAdminClient();
    const { data: row } = await admin
      .from("missions")
      .select("title")
      .eq("id", mission.id)
      .single();
    expect(row?.title).toBe(`Mission cible ${uniqueId}`);
  });

  it("rejects insert when rules_text is only whitespace (check constraint)", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-rules-ws-${uniqueId}` });
    const adminUser = await createAuthenticatedTestUser();
    await setProfileIsAdmin(adminUser.userId, true);

    const { data, error } = await insertMissionWithUserClient(adminUser.client, {
      brandId: brand.id,
      uniqueSuffix: uniqueId,
      overrides: { rules_text: "   \n\t  " },
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
