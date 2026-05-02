/** Query keys for wallet reads; keep in sync with wallet query hooks. */
export const walletKeys = {
  all: ["wallet"] as const,
  balance: (userId: string) => [...walletKeys.all, "balance", userId] as const,
  pendingRewards: (userId: string) =>
    [...walletKeys.all, "pendingRewards", userId] as const,
  transactions: (userId: string) =>
    [...walletKeys.all, "transactions", userId] as const,
};
