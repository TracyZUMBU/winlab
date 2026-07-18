import { describe, expect, it } from "@jest/globals";

import { isInvalidRefreshTokenError } from "./authErrors";

describe("isInvalidRefreshTokenError", () => {
  it("detects refresh_token_not_found code", () => {
    expect(
      isInvalidRefreshTokenError({
        code: "refresh_token_not_found",
        message: "Invalid Refresh Token: Refresh Token Not Found",
      }),
    ).toBe(true);
  });

  it("detects invalid refresh token message", () => {
    expect(
      isInvalidRefreshTokenError({
        message: "AuthApiError: Invalid Refresh Token: Refresh Token Not Found",
      }),
    ).toBe(true);
  });

  it("ignores unrelated auth errors", () => {
    expect(
      isInvalidRefreshTokenError({
        code: "otp_expired",
        message: "Token has expired or is invalid",
      }),
    ).toBe(false);
  });

  it("ignores non-objects", () => {
    expect(isInvalidRefreshTokenError(null)).toBe(false);
    expect(isInvalidRefreshTokenError("refresh_token_not_found")).toBe(false);
  });
});
