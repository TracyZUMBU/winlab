import { afterEach, describe, expect, it } from "@jest/globals";

import {
  isPasswordLoginEmail,
  normalizeAuthEmail,
  parsePasswordLoginEmails,
  resetPasswordLoginEmailWhitelistCacheForTests,
} from "./passwordLoginEmails";

describe("normalizeAuthEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeAuthEmail("  Review@Example.COM ")).toBe(
      "review@example.com",
    );
  });
});

describe("parsePasswordLoginEmails", () => {
  it("returns empty set for null, undefined, or blank", () => {
    expect(parsePasswordLoginEmails(null).size).toBe(0);
    expect(parsePasswordLoginEmails(undefined).size).toBe(0);
    expect(parsePasswordLoginEmails("").size).toBe(0);
    expect(parsePasswordLoginEmails("   ").size).toBe(0);
  });

  it("parses comma-separated emails and normalizes", () => {
    const set = parsePasswordLoginEmails(
      " AppStore@Winlab.app , demo@winlab.app,,  ",
    );
    expect(set.has("appstore@winlab.app")).toBe(true);
    expect(set.has("demo@winlab.app")).toBe(true);
    expect(set.size).toBe(2);
  });
});

describe("isPasswordLoginEmail", () => {
  const original = process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS;
    } else {
      process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS = original;
    }
    resetPasswordLoginEmailWhitelistCacheForTests();
  });

  it("returns false when env is unset", () => {
    delete process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS;
    resetPasswordLoginEmailWhitelistCacheForTests();
    expect(isPasswordLoginEmail("anyone@example.com")).toBe(false);
  });

  it("matches whitelist after normalization", () => {
    process.env.EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS =
      "review@winlab.app,other@winlab.app";
    resetPasswordLoginEmailWhitelistCacheForTests();

    expect(isPasswordLoginEmail("  Review@Winlab.APP ")).toBe(true);
    expect(isPasswordLoginEmail("other@winlab.app")).toBe(true);
    expect(isPasswordLoginEmail("stranger@winlab.app")).toBe(false);
    expect(isPasswordLoginEmail("")).toBe(false);
  });
});
