import { generateOptionId, generateQuestionId } from "./surveyDraftIds";

describe("surveyDraftIds", () => {
  it("generateQuestionId returns a value not in existing", () => {
    const existing = new Set(["q_taken"]);
    const id = generateQuestionId(existing);
    expect(existing.has(id)).toBe(false);
    expect(id.startsWith("q_")).toBe(true);
  });

  it("generateOptionId uses numeric suffix fallback after random retries exhaust", () => {
    const uuidSpy = jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    try {
      const existing = new Set<string>();
      const base = "opt_aaaaaaaaaa";
      existing.add(base);
      for (let i = 1; i <= 50; i++) {
        existing.add(`${base}_${i}`);
      }

      const id = generateOptionId(existing);
      expect(existing.has(id)).toBe(false);
      expect(id).toBe(`${base}_51`);
    } finally {
      uuidSpy.mockRestore();
    }
  });

  it("returns only unique ids across many generations", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateQuestionId(ids);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });
});
