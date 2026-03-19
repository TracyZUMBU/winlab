import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { getPendingRewardsAmount } from "../services/getPendingRewardsAmount";

export type PendingRewardsUi = {
  pendingRewards: number;
  pendingRewardsFormatted: string;
};

export function usePendingRewardsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["wallet", "pendingRewards", userId],
    queryFn: () => getPendingRewardsAmount(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
    select: (amount): PendingRewardsUi => ({
      pendingRewards: amount,
      pendingRewardsFormatted: amount.toString(),
    }),
  });
}

