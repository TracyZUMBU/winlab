export const authKeys = {
  all: ["auth"] as const,
  session: () => ["auth", "session"] as const,
  adminAuthorization: (userId: string) =>
    ["auth", "adminAuthorization", userId] as const,
};
