import { describe, expect, it } from "@jest/globals";

import { parseUserParticipationRpcRow } from "./parseUserParticipationRpcRow";

describe("parseUserParticipationRpcRow", () => {
  it("parses a valid RPC row", () => {
    const parsed = parseUserParticipationRpcRow({
      lottery_id: "lottery-1",
      title: "Grand tirage",
      image_url: "https://example.com/img.jpg",
      draw_at: "2026-07-20T12:00:00.000Z",
      status: "active",
      user_tickets_count: 3,
      last_participated_at: "2026-07-19T10:00:00.000Z",
    });

    expect(parsed).toEqual({
      lottery_id: "lottery-1",
      title: "Grand tirage",
      image_url: "https://example.com/img.jpg",
      draw_at: "2026-07-20T12:00:00.000Z",
      status: "active",
      user_tickets_count: 3,
      last_participated_at: "2026-07-19T10:00:00.000Z",
    });
  });

  it("coerces bigint-like ticket counts from RPC", () => {
    const parsed = parseUserParticipationRpcRow({
      lottery_id: "lottery-1",
      title: "Grand tirage",
      image_url: null,
      draw_at: "2026-07-20T12:00:00.000Z",
      status: "drawn",
      user_tickets_count: "2",
      last_participated_at: "2026-07-19T10:00:00.000Z",
    });

    expect(parsed?.user_tickets_count).toBe(2);
    expect(parsed?.image_url).toBeNull();
  });

  it("returns null for invalid rows", () => {
    expect(parseUserParticipationRpcRow(null)).toBeNull();
    expect(parseUserParticipationRpcRow({})).toBeNull();
    expect(
      parseUserParticipationRpcRow({
        lottery_id: "lottery-1",
        title: "x",
        draw_at: "2026-07-20T12:00:00.000Z",
        status: "unknown",
        user_tickets_count: 1,
        last_participated_at: "2026-07-19T10:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      parseUserParticipationRpcRow({
        lottery_id: "lottery-1",
        title: "x",
        draw_at: "2026-07-20T12:00:00.000Z",
        status: "active",
        user_tickets_count: -1,
        last_participated_at: "2026-07-19T10:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      parseUserParticipationRpcRow({
        lottery_id: "lottery-1",
        title: "x",
        draw_at: "2026-07-20T12:00:00.000Z",
        status: "active",
        user_tickets_count: "",
        last_participated_at: "2026-07-19T10:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      parseUserParticipationRpcRow({
        lottery_id: "lottery-1",
        title: "x",
        draw_at: "2026-07-20T12:00:00.000Z",
        status: "active",
        user_tickets_count: 1.5,
        last_participated_at: "2026-07-19T10:00:00.000Z",
      }),
    ).toBeNull();
  });
});
