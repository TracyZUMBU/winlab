import { createAuthenticatedTestUser } from "../factories/auth";
import { createBrand } from "../factories/brands";
import { createMission } from "../factories/missions";
import { createMissionCompletion } from "../factories/mission_completion";

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

  it("excludes repeatable mission when approved_count >= max_completions_per_user", async () => {
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
});

