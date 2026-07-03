import {
  getHevcVideoUrlError,
  inferCodecHintFromUrl,
  isHevcVideoUrl,
} from "./videoCodecSupport";

describe("videoCodecSupport", () => {
  it("detects HEVC from URL hints", () => {
    expect(
      inferCodecHintFromUrl(
        "https://lorem.video/bunny_4k_h265_30fps_60s_23crf_aac_192kbps.mp4",
      ),
    ).toBe("hevc");
    expect(isHevcVideoUrl("https://cdn.example.com/clip-hevc.mp4")).toBe(true);
  });

  it("detects H.264 from URL hints", () => {
    expect(inferCodecHintFromUrl("https://cdn.example.com/bunny_h264.mp4")).toBe(
      "h264",
    );
    expect(isHevcVideoUrl("https://cdn.example.com/bunny_h264.mp4")).toBe(
      false,
    );
  });

  it("returns validation error for HEVC URLs", () => {
    expect(
      getHevcVideoUrlError(
        "https://lorem.video/bunny_4k_h265_30fps_60s_23crf_aac_192kbps.mp4",
      ),
    ).toMatch(/H\.265/);
    expect(getHevcVideoUrlError("https://cdn.example.com/ok.mp4")).toBeNull();
    expect(getHevcVideoUrlError("")).toBeNull();
  });
});
