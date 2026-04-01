export const lotteryListKeys = {
  all: ["lotteries"] as const,
  available: (userId: string | null) =>
    ["lotteries", "available", userId] as const,
};
