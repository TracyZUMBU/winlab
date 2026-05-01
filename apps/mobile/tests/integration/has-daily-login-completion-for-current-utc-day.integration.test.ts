import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  createMissionCompletion,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const RPC = "has_daily_login_completion_for_current_utc_day";

describe("has_daily_login_completion_for_current_utc_day RPC (integration)", () => {
  it("returns false when user has no completion for current UTC day", async () => {
    const user = await createAuthenticatedTestUser();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "daily_login",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Daily login ${uniqueId}`,
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("returns true when pending completion exists for current UTC day", async () => {
    const user = await createAuthenticatedTestUser();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-p-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "daily_login",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Daily login P ${uniqueId}`,
    });

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "pending",
      completed_at: new Date().toISOString(),
      proof_data: {},
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("returns false when completion is rejected for current UTC day", async () => {
    const user = await createAuthenticatedTestUser();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-r-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "daily_login",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Daily login R ${uniqueId}`,
    });

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "rejected",
      completed_at: new Date().toISOString(),
      proof_data: {},
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("returns false when completion completed_at is not current UTC day", async () => {
    const user = await createAuthenticatedTestUser();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-old-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "daily_login",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Daily login old ${uniqueId}`,
    });

    const past = new Date();
    past.setUTCDate(past.getUTCDate() - 2);

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
      completed_at: past.toISOString(),
      proof_data: {},
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("returns true when completion exists today even if mission is paused (hidden from missions SELECT RLS)", async () => {
    const user = await createAuthenticatedTestUser();
    const admin = getSupabaseAdminClient();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-paused-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "daily_login",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Daily login paused ${uniqueId}`,
    });

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "pending",
      completed_at: new Date().toISOString(),
      proof_data: {},
    });

    const { error: pauseError } = await admin
      .from("missions")
      .update({ status: "paused" })
      .eq("id", mission.id);

    expect(pauseError).toBeNull();

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("returns false for non-daily_login mission id even if completion exists", async () => {
    const user = await createAuthenticatedTestUser();
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-dl-has-survey-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      mission_type: "survey",
      validation_mode: "automatic",
      token_reward: 10,
      title: `Survey ${uniqueId}`,
    });

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
      completed_at: new Date().toISOString(),
      proof_data: {},
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_mission_id: mission.id,
    });

    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
