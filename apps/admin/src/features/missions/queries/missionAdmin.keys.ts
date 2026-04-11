import type { AdminMissionsListQueryInput } from "../types/missionAdmin";

export const missionAdminKeys = {
  all: ["missionAdmin"] as const,
  brandsFilterOptions: () => ["missionAdmin", "brandsFilterOptions"] as const,
  lists: () => ["missionAdmin", "list"] as const,
  list: (input: AdminMissionsListQueryInput) =>
    ["missionAdmin", "list", input] as const,
  details: () => ["missionAdmin", "detail"] as const,
  detail: (missionId: string) => ["missionAdmin", "detail", missionId] as const,
};
