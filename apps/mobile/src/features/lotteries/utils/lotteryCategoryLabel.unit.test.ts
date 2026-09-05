import { afterEach, describe, expect, it } from "@jest/globals";

import i18n from "@/src/i18n";

import { resolveLotteryCategoryLabel } from "./lotteryCategoryLabel";

const DEFAULT_LOCALE = "fr";

describe("resolveLotteryCategoryLabel", () => {
  afterEach(async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE);
  });

  it("returns translated label for known categories in French", async () => {
    await i18n.changeLanguage("fr");
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "entertainment")).toBe(
      "Divertissement",
    );
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "mode")).toBe("Mode");
  });

  it("returns translated label for known categories in English", async () => {
    await i18n.changeLanguage("en");
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "entertainment")).toBe(
      "Entertainment",
    );
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "mode")).toBe("Fashion");
  });

  it("falls back to raw value for unknown categories", () => {
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "gift-card")).toBe(
      "gift-card",
    );
  });

  it("returns null for empty category", () => {
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), null)).toBeNull();
    expect(resolveLotteryCategoryLabel(i18n.t.bind(i18n), "  ")).toBeNull();
  });
});
