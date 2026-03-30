import { createAuthenticatedTestUser } from "../factories/auth";
import { createBrand } from "../factories/brands";
import { createLottery } from "../factories/lotteries";
import { createLotteryTicket } from "../factories/lottery_tickets";
import { createMission } from "../factories/missions";
import { createMissionCompletion } from "../factories/mission_completion";
import { createWalletTransaction } from "../factories/wallet_transactions";
import { getSupabaseAnonClient } from "../utils/supabaseTestClient";

const RPC = "get_user_home_dashboard";

describe("get_user_home_dashboard RPC (integration)", () => {
  it("returns profile, balance, ongoing lotteries, participations, and mission previews", async () => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const brand = await createBrand({ name: `brand-home-${uniqueId}` });

    const drawAt = new Date(Date.now() + 86400_000).toISOString();
    const endsAt = new Date(Date.now() + 43200_000).toISOString();

    const lottery = await createLottery({
      brand_id: brand.id,
      status: "active",
      draw_at: drawAt,
      ends_at: endsAt,
      title: `Home dash lottery ${uniqueId}`,
    });

    const user = await createAuthenticatedTestUser();

    await createWalletTransaction({
      user_id: user.userId,
      amount: 1250,
      direction: "credit",
      transaction_type: "manual_adjustment",
    });

    await createLotteryTicket({
      lottery_id: lottery.id,
      user_id: user.userId,
      status: "active",
    });

    const otherUser = await createAuthenticatedTestUser();
    await createLotteryTicket({
      lottery_id: lottery.id,
      user_id: otherUser.userId,
      status: "active",
    });

    const mission = await createMission({
      brand_id: brand.id,
      title: `Home dash mission ${uniqueId}`,
      status: "active",
      mission_type: "survey",
      token_reward: 10,
      max_completions_per_user: 2,
    });

    // Repeatable mission logic:
    // - when approved_count < max_completions_per_user, mission must be included
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });

    const { data, error } = await user.client.rpc(RPC);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(typeof data).toBe("object");

    const payload = data as Record<string, unknown>;

    expect(payload.wallet_balance).toBe(1250);

    const profile = payload.profile as Record<string, unknown>;
    expect(typeof profile.username).toBe("string");

    const ongoing = payload.ongoing_lotteries as unknown[];
    expect(Array.isArray(ongoing)).toBe(true);
    const ongoingMatch = ongoing.find(
      (row) => (row as { id?: string }).id === lottery.id,
    ) as
      | {
          id: string;
          active_tickets_count: number;
          user_active_tickets_count: number;
        }
      | undefined;
    expect(ongoingMatch).toBeTruthy();
    expect(ongoingMatch?.active_tickets_count).toBe(2);
    expect(ongoingMatch?.user_active_tickets_count).toBe(1);

    const participations = payload.participations as unknown[];
    expect(Array.isArray(participations)).toBe(true);
    const part = participations.find(
      (row) => (row as { lottery_id?: string }).lottery_id === lottery.id,
    ) as
      | {
          lottery_id: string;
          user_ticket_count: number;
          total_active_tickets: number;
          win_probability: number | null;
        }
      | undefined;
    expect(part).toBeTruthy();
    expect(part?.user_ticket_count).toBe(1);
    expect(part?.total_active_tickets).toBe(2);
    expect(part?.win_probability).toBeCloseTo(0.5, 5);

    const missions = payload.mission_previews as unknown[];
    expect(Array.isArray(missions)).toBe(true);
    expect(
      missions.some((m) => (m as { id?: string }).id === mission.id),
    ).toBe(true);

    // Once the user reaches approved_count >= max_completions_per_user,
    // the mission must be excluded from the "todo/preview" list.
    await createMissionCompletion({
      mission_id: mission.id,
      user_id: user.userId,
      status: "approved",
    });

    const { data: dataAfterMax, error: errorAfterMax } = await user.client.rpc(RPC);
    expect(errorAfterMax).toBeNull();
    const payloadAfterMax = dataAfterMax as Record<string, unknown>;
    const missionsAfterMax = payloadAfterMax.mission_previews as unknown[];
    expect(Array.isArray(missionsAfterMax)).toBe(true);
    expect(
      missionsAfterMax.some((m) => (m as { id?: string }).id === mission.id),
    ).toBe(false);

    const anon = getSupabaseAnonClient();
    const { data: anonData, error: anonError } = await anon.rpc(RPC);
    expect(anonData).toBeNull();
    expect(anonError).toBeTruthy();
    expect(anonError?.message ?? "").toContain("UNAUTHENTICATED");
  });
});
