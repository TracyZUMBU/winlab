export type SplashBootstrapStatus = "idle" | "loading" | "ready" | "error";

export function shouldLeaveSplashRoute({
  bootstrapStatus,
  reactSplashMinTimeElapsed,
  pathname,
  redirectTo,
}: {
  bootstrapStatus: SplashBootstrapStatus;
  reactSplashMinTimeElapsed: boolean;
  pathname: string;
  redirectTo: string | null;
}): boolean {
  if (bootstrapStatus !== "ready") return false;
  if (!reactSplashMinTimeElapsed) return false;
  if (pathname !== "/") return false;
  if (!redirectTo) return false;
  return redirectTo !== pathname;
}
