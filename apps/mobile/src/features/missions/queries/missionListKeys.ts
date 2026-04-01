export const missionListKeys = {
  all: ["missions", "list"] as const,
  todo: (userId: string) => [...missionListKeys.all, "todo", userId] as const,
  completed: (userId: string) =>
    [...missionListKeys.all, "completed", userId] as const,
};
