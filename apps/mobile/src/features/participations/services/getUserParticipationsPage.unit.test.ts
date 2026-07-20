import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getSupabaseClient } from "@/src/lib/supabase/client";

import {
  getUserParticipationsPage,
  USER_PARTICIPATIONS_PAGE_SIZE,
} from "./getUserParticipationsPage";

jest.mock("@/src/lib/supabase/client", () => ({
  __esModule: true,
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
  typeof getSupabaseClient
>;

type RpcResult = {
  data: unknown;
  error: { message: string; code: string } | null;
};

describe("getUserParticipationsPage", () => {
  const mockRpc = jest.fn<() => Promise<RpcResult>>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({
      rpc: mockRpc,
    } as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it("calls RPC with limit and offset derived from page index", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          lottery_id: "lottery-1",
          title: "Grand tirage",
          image_url: null,
          draw_at: "2026-07-20T12:00:00.000Z",
          status: "active",
          user_tickets_count: 1,
          last_participated_at: "2026-07-19T10:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await getUserParticipationsPage({ pageIndex: 2, pageSize: 10 });

    expect(mockRpc).toHaveBeenCalledWith("get_user_participations", {
      p_limit: 10,
      p_offset: 20,
    });
    expect(result.participations).toHaveLength(1);
    expect(result.participations[0]?.lottery_id).toBe("lottery-1");
  });

  it("uses default page size when not provided", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await getUserParticipationsPage({ pageIndex: 0 });

    expect(mockRpc).toHaveBeenCalledWith("get_user_participations", {
      p_limit: USER_PARTICIPATIONS_PAGE_SIZE,
      p_offset: 0,
    });
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = { message: "rpc failed", code: "500" };
    mockRpc.mockResolvedValue({ data: null, error: rpcError });

    await expect(getUserParticipationsPage({ pageIndex: 0 })).rejects.toEqual(
      rpcError,
    );
  });

  it("throws when a RPC row is malformed", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          lottery_id: "lottery-1",
          title: "Valid",
          image_url: null,
          draw_at: "2026-07-20T12:00:00.000Z",
          status: "active",
          user_tickets_count: 1,
          last_participated_at: "2026-07-19T10:00:00.000Z",
        },
        { lottery_id: "broken" },
      ],
      error: null,
    });

    await expect(getUserParticipationsPage({ pageIndex: 0 })).rejects.toThrow(
      "get_user_participations returned an invalid row",
    );
  });
});
