import {
  getLotteryCardLayout,
  getLotteryCardVariant,
  hashString,
  splitLotteriesIntoMasonryColumns,
} from "./lotteryCatalogMasonryLayout";

function makeItem(
  id: string,
  overrides: Partial<{ user_active_tickets_count: number }> = {},
) {
  return {
    id,
    user_active_tickets_count: 0,
    ...overrides,
  };
}

describe("lotteryCatalogMasonryLayout", () => {
  it("hashString is deterministic", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });

  it("getLotteryCardVariant is stable for a given id", () => {
    const v = getLotteryCardVariant("550e8400-e29b-41d4-a716-446655440000");
    expect(v).toMatch(/^(compact|regular|tall)$/);
    expect(getLotteryCardVariant("550e8400-e29b-41d4-a716-446655440000")).toBe(
      v,
    );
  });

  it("estimated height increases when user has tickets (packing weight)", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const without = getLotteryCardLayout(makeItem(id));
    const withTickets = getLotteryCardLayout(
      makeItem(id, { user_active_tickets_count: 2 }),
    );
    expect(withTickets.estimatedHeight).toBeGreaterThan(without.estimatedHeight);
  });

  it("prefix placements are unchanged when the list grows (pagination-stable)", () => {
    const ids = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333",
      "44444444-4444-4444-4444-444444444444",
    ];
    const shortList = ids.slice(0, 3).map((id) => makeItem(id));
    const longList = ids.map((id) => makeItem(id));

    const a = splitLotteriesIntoMasonryColumns(shortList);
    const b = splitLotteriesIntoMasonryColumns(longList);

    const shortIdSet = new Set(shortList.map((s) => s.id));

    expect(a.left.map((p) => p.item.id)).toEqual(
      b.left.filter((p) => shortIdSet.has(p.item.id)).map((p) => p.item.id),
    );
    expect(a.right.map((p) => p.item.id)).toEqual(
      b.right.filter((p) => shortIdSet.has(p.item.id)).map((p) => p.item.id),
    );

    for (const id of shortIdSet) {
      const shortPlacement = [...a.left, ...a.right].find((p) => p.item.id === id);
      const longPlacement = [...b.left, ...b.right].find((p) => p.item.id === id);
      expect(shortPlacement!.layout).toEqual(longPlacement!.layout);
    }
  });
});
