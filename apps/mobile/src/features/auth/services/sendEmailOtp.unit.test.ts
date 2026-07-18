import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getSupabaseClient } from "@/src/lib/supabase/client";
import { supabaseEnv } from "@/src/lib/supabase/env";
import { monitoring } from "@/src/lib/monitoring";

import {
  isEmailOtpSendInFlight,
  resetEmailOtpClientRateLimitForTests,
} from "../utils/emailOtpClientRateLimit";
import { sendEmailOtp } from "./sendEmailOtp";

jest.mock("@/src/lib/supabase/client", () => ({
  __esModule: true,
  getSupabaseClient: jest.fn(),
}));

jest.mock("@/src/lib/supabase/env", () => {
  let url = "https://example.supabase.co";
  return {
    __esModule: true,
    supabaseEnv: {
      get url() {
        return url;
      },
      set url(value: string) {
        url = value;
      },
      anonKey: "test-anon-key",
      isConfigured: true,
      platform: "ios",
    },
  };
});

jest.mock("@/src/lib/monitoring", () => ({
  __esModule: true,
  monitoring: {
    captureMessage: jest.fn(),
    captureException: jest.fn(),
  },
}));

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
  typeof getSupabaseClient
>;

describe("sendEmailOtp rate-limit slot cleanup", () => {
  const email = "slot-cleanup@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
    resetEmailOtpClientRateLimitForTests();
    supabaseEnv.url = "https://example.supabase.co";
  });

  it("releases in-flight slot when getSupabaseClient throws", async () => {
    mockGetSupabaseClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });

    const result = await sendEmailOtp({ email, requestId: "req-client" });

    expect(result).toMatchObject({
      success: false,
      kind: "technical",
      diagnostic: {
        branch: "caught_exception",
        errorName: "Error",
        errorMessage: "Supabase is not configured",
      },
    });
    expect(isEmailOtpSendInFlight(email)).toBe(false);
    expect(monitoring.captureException).toHaveBeenCalled();
  });

  it("releases in-flight slot when connectivity probe rejects", async () => {
    mockGetSupabaseClient.mockReturnValue({
      auth: {
        signInWithOtp: jest.fn(),
      },
    } as unknown as ReturnType<typeof getSupabaseClient>);

    Object.defineProperty(supabaseEnv, "url", {
      configurable: true,
      enumerable: true,
      get() {
        throw new Error("connectivity probe failed");
      },
      set() {
        /* allow beforeEach reset via redefine below */
      },
    });

    try {
      const result = await sendEmailOtp({ email, requestId: "req-probe" });

      expect(result).toMatchObject({
        success: false,
        kind: "technical",
        diagnostic: {
          branch: "caught_exception",
          errorName: "Error",
          errorMessage: "connectivity probe failed",
        },
      });
      expect(isEmailOtpSendInFlight(email)).toBe(false);
      expect(monitoring.captureException).toHaveBeenCalled();
    } finally {
      let url = "https://example.supabase.co";
      Object.defineProperty(supabaseEnv, "url", {
        configurable: true,
        enumerable: true,
        get() {
          return url;
        },
        set(value: string) {
          url = value;
        },
      });
    }
  });
});
