export const participationKeys = {
  all: ["participations"] as const,
  lists: () => [...participationKeys.all, "list"] as const,
  list: (userId: string) => [...participationKeys.lists(), userId] as const,
  anonymous: () => [...participationKeys.lists(), "none"] as const,
};
