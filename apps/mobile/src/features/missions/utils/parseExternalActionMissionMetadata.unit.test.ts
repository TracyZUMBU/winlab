import type { Json } from "@/src/types/json";

import { parseExternalActionMissionMetadata } from "./parseExternalActionMissionMetadata";

describe("parseExternalActionMissionMetadata", () => {
  it("returns null when metadata is null or not an object", () => {
    expect(parseExternalActionMissionMetadata(null)).toBeNull();
    expect(parseExternalActionMissionMetadata(undefined)).toBeNull();
    expect(parseExternalActionMissionMetadata([])).toBeNull();
    expect(parseExternalActionMissionMetadata("x")).toBeNull();
  });

  it("returns null when a required string field is missing or blank", () => {
    expect(
      parseExternalActionMissionMetadata({
        external_url: "https://a.com",
        platform: "instagram",
      }),
    ).toBeNull();
    expect(
      parseExternalActionMissionMetadata({
        external_url: "   ",
        platform: "instagram",
        action_label: "Go",
      }),
    ).toBeNull();
  });

  it("parses valid metadata and normalizes platform to lowercase", () => {
    const parsed = parseExternalActionMissionMetadata({
      external_url: " https://instagram.com/x ",
      platform: "Instagram",
      action_label: " Suivre ",
      min_external_duration_seconds: 12,
    });
    expect(parsed).toEqual({
      external_url: "https://instagram.com/x",
      platform: "instagram",
      action_label: "Suivre",
      min_external_duration_seconds: 12,
    });
  });

  it("omits min_external_duration_seconds when absent or invalid", () => {
    expect(
      parseExternalActionMissionMetadata({
        external_url: "https://a.com",
        platform: "website",
        action_label: "Visit",
      }),
    ).toEqual({
      external_url: "https://a.com",
      platform: "website",
      action_label: "Visit",
    });
    expect(
      parseExternalActionMissionMetadata({
        external_url: "https://a.com",
        platform: "website",
        action_label: "Visit",
        min_external_duration_seconds: -1,
      }),
    ).toEqual({
      external_url: "https://a.com",
      platform: "website",
      action_label: "Visit",
    });
  });

  it("accepts min_external_duration_seconds as non-negative integer string", () => {
    expect(
      parseExternalActionMissionMetadata({
        external_url: "https://a.com",
        platform: "tiktok",
        action_label: "Like",
        min_external_duration_seconds: "8",
      } as Json),
    ).toEqual({
      external_url: "https://a.com",
      platform: "tiktok",
      action_label: "Like",
      min_external_duration_seconds: 8,
    });
  });
});
