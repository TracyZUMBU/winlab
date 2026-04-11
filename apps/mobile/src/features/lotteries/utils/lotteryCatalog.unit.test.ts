import {
  compareLotteriesForCatalog,
  filterLotteriesByScope,
  parseLotteryCatalogScope,
} from "./lotteryCatalog";
import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";

function row(p: Partial<AvailableLotteryUi>): AvailableLotteryUi {
  return {
    id: p.id ?? "x",
    title: p.title ?? "T",
    short_description: null,
    image_url: null,
    ticket_cost: 1,
    ends_at: p.ends_at ?? null,
    category: p.category ?? null,
    is_featured: p.is_featured ?? false,
    status: "active",
    brand: null,
    active_tickets_count: 0,
    user_active_tickets_count: p.user_active_tickets_count ?? 0,
    statusLabel: "",
    participantsLabel: "",
    ticketCostLabel: "",
    userTicketsLabel: "",
  };
}

describe("parseLotteryCatalogScope", () => {
  it("parses known filters", () => {
    expect(parseLotteryCatalogScope("endingSoon")).toBe("endingSoon");
    expect(parseLotteryCatalogScope("featured")).toBe("featured");
    expect(parseLotteryCatalogScope("giftCard")).toBe("giftCard");
  });

  it("defaults to all", () => {
    expect(parseLotteryCatalogScope(undefined)).toBe("all");
    expect(parseLotteryCatalogScope("nope")).toBe("all");
    expect(parseLotteryCatalogScope(["endingSoon"])).toBe("endingSoon");
  });
});

describe("compareLotteriesForCatalog", () => {
  it("orders featured before non-featured", () => {
    const a = row({ id: "a", is_featured: false });
    const b = row({ id: "b", is_featured: true });
    expect(compareLotteriesForCatalog(a, b)).toBeGreaterThan(0);
    expect(compareLotteriesForCatalog(b, a)).toBeLessThan(0);
  });
});

describe("filterLotteriesByScope giftCard", () => {
  it("keeps only gift-card category", () => {
    const now = Date.now();
    const items = [
      row({ id: "1", category: "gift-card" }),
      row({ id: "2", category: "other" }),
    ];
    expect(filterLotteriesByScope(items, "giftCard", now)).toHaveLength(1);
    expect(filterLotteriesByScope(items, "giftCard", now)[0].id).toBe("1");
  });
});
