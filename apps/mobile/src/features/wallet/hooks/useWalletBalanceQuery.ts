import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { getWalletBalance } from "../services/getWalletBalance";

export type WalletBalanceUi = {
  balance: number;
  balanceFormatted: string;
};

export function useWalletBalanceQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["wallet", "balance", userId],
    queryFn: () => getWalletBalance(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    select: (balance): WalletBalanceUi => ({
      balance,
      balanceFormatted: balance.toString(),
    }),
  });
}
