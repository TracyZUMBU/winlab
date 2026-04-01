export const homeDashboardKeys = {
  all: ["home", "dashboard"] as const,
  detail: (userId: string) => [...homeDashboardKeys.all, userId] as const,
};
