import { shouldLeaveSplashRoute } from "./shouldLeaveSplashRoute";

describe("shouldLeaveSplashRoute", () => {
  const ready = {
    bootstrapStatus: "ready" as const,
    reactSplashMinTimeElapsed: true,
    pathname: "/",
    redirectTo: "/(app)",
  };

  it("waits until bootstrap is ready", () => {
    expect(
      shouldLeaveSplashRoute({ ...ready, bootstrapStatus: "loading" }),
    ).toBe(false);
  });

  it("waits until the React splash has been visible long enough", () => {
    expect(
      shouldLeaveSplashRoute({ ...ready, reactSplashMinTimeElapsed: false }),
    ).toBe(false);
  });

  it("does not redirect away from another route", () => {
    expect(shouldLeaveSplashRoute({ ...ready, pathname: "/(app)" })).toBe(
      false,
    );
  });

  it("does not redirect when the destination is missing or already current", () => {
    expect(shouldLeaveSplashRoute({ ...ready, redirectTo: null })).toBe(false);
    expect(shouldLeaveSplashRoute({ ...ready, redirectTo: "/" })).toBe(false);
  });

  it("leaves the splash route when bootstrap and min visible time are done", () => {
    expect(shouldLeaveSplashRoute(ready)).toBe(true);
  });
});
