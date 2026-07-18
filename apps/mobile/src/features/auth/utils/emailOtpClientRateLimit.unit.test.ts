import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EMAIL_OTP_CLIENT_COOLDOWN_MS,
  getEmailOtpCooldownRemainingMs,
  isEmailOtpSendInFlight,
  markEmailOtpSendSucceeded,
  releaseEmailOtpSendAttempt,
  resetEmailOtpClientRateLimitForTests,
  tryAcquireEmailOtpSend,
} from "./emailOtpClientRateLimit";

describe("emailOtpClientRateLimit", () => {
  beforeEach(() => {
    resetEmailOtpClientRateLimitForTests();
  });

  it("allows first acquire and blocks concurrent in-flight", () => {
    expect(tryAcquireEmailOtpSend("User@Example.com")).toBe(true);
    expect(isEmailOtpSendInFlight("user@example.com")).toBe(true);
    expect(tryAcquireEmailOtpSend("user@example.com")).toBe(false);
    releaseEmailOtpSendAttempt("user@example.com");
    expect(isEmailOtpSendInFlight("user@example.com")).toBe(false);
  });

  it("enforces cooldown after success", () => {
    const t0 = 1_000_000;
    expect(tryAcquireEmailOtpSend("a@b.co", t0)).toBe(true);
    markEmailOtpSendSucceeded("a@b.co", t0);
    releaseEmailOtpSendAttempt("a@b.co");

    expect(getEmailOtpCooldownRemainingMs("a@b.co", t0 + 1_000)).toBe(
      EMAIL_OTP_CLIENT_COOLDOWN_MS - 1_000,
    );
    expect(tryAcquireEmailOtpSend("a@b.co", t0 + 1_000)).toBe(false);

    const afterCooldown = t0 + EMAIL_OTP_CLIENT_COOLDOWN_MS;
    expect(getEmailOtpCooldownRemainingMs("a@b.co", afterCooldown)).toBe(0);
    expect(tryAcquireEmailOtpSend("a@b.co", afterCooldown)).toBe(true);
    releaseEmailOtpSendAttempt("a@b.co");
  });

  it("does not start cooldown when send fails (no mark)", () => {
    const t0 = 2_000_000;
    expect(tryAcquireEmailOtpSend("fail@test.com", t0)).toBe(true);
    releaseEmailOtpSendAttempt("fail@test.com");
    expect(tryAcquireEmailOtpSend("fail@test.com", t0 + 1)).toBe(true);
    releaseEmailOtpSendAttempt("fail@test.com");
  });
});
