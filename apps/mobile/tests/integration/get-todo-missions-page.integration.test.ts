import {
  createAuthenticatedTestUser,
  createBrand,
  createMission,
  createMissionCompletion,
} from "@winlab/supabase-test-utils";

const RPC = "get_todo_missions_page";

describe("get_todo_missions_page RPC (integration)", () => {
  it("includes repeatable mission when approved_count < max_completions_per_user", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-todo-${uniqueId}` });

    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
      mission_type: "survey",
      token_reward: 10,
      max_completions_per_user: 2,
    });

    const user = await createAuthenticatedTestUser();

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_limit: 10,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data ?? []).some((m) => m.id === mission.id)).toBe(true);
  });

  it("excludes repeatable mission when (pending+approved) count >= max_completions_per_user", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-todo-${uniqueId}` });

    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
      mission_type: "survey",
      token_reward: 10,
      max_completions_per_user: 2,
    });

    const user = await createAuthenticatedTestUser();

    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_limit: 10,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data ?? []).some((m) => m.id === mission.id)).toBe(false);
  });

  it("excludes mission when pending alone reaches per-user cap", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-todo-pending-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
      mission_type: "survey",
      token_reward: 10,
      max_completions_per_user: 1,
    });
    const user = await createAuthenticatedTestUser();
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "pending",
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_limit: 10,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect((data ?? []).some((m) => m.id === mission.id)).toBe(false);
  });

  it("excludes repeatable mission when one approved and one pending fill the cap", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-todo-mix-${uniqueId}` });
    const mission = await createMission({
      brand_id: brand.id,
      status: "active",
      mission_type: "survey",
      token_reward: 10,
      max_completions_per_user: 2,
    });
    const user = await createAuthenticatedTestUser();
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "pending",
    });

    const { data, error } = await user.client.rpc(RPC, {
      p_limit: 10,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect((data ?? []).some((m) => m.id === mission.id)).toBe(false);
  });
});

