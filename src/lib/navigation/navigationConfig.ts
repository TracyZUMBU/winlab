export const routes = {
  root: "/",
  splash: "/",
  onboarding: "/onboarding",
} as const;

export type AppRouteName = keyof typeof routes;
