import { validateCreateLotteryForm } from "./validateCreateLotteryForm";
import { getDefaultLotteryScheduleLocalParis } from "./lotteryFormParisTime";

describe("validateCreateLotteryForm", () => {
  const schedule = getDefaultLotteryScheduleLocalParis(
    new Date("2026-06-01T08:00:00.000Z"),
  );

  const validBase = {
    brand_id: "00000000-0000-4000-8000-000000000001",
    title: "Ma loterie",
    category: "entertainment",
    ticket_cost: "50",
    number_of_winners: "1",
    starts_at_local: schedule.startsAtLocal,
    ends_at_local: schedule.endsAtLocal,
    draw_at_local: schedule.drawAtLocal,
    status: "draft",
  };

  it("accepts coherent default schedule", () => {
    const result = validateCreateLotteryForm(validBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.title).toBe("Ma loterie");
      expect(result.payload.ends_at).toMatch(/Z$/);
    }
  });

  it("rejects when end is before start", () => {
    const result = validateCreateLotteryForm({
      ...validBase,
      ends_at_local: schedule.startsAtLocal,
      draw_at_local: schedule.drawAtLocal,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/fin doit être après l’ouverture/i);
    }
  });

  it("rejects cancelled status", () => {
    const result = validateCreateLotteryForm({
      ...validBase,
      status: "cancelled",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing category", () => {
    const result = validateCreateLotteryForm({
      ...validBase,
      category: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/catégorie/i);
    }
  });

  it("rejects unknown category", () => {
    const result = validateCreateLotteryForm({
      ...validBase,
      category: "gift-card",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/pas autorisée/i);
    }
  });
});
