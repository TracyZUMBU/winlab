import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/src/lib/query/queryClient";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { homeDashboardKeys } from "@/src/features/home/queries/homeDashboardKeys";

import { lotteryListKeys } from "../queries/lotteryListKeys";
import { buyTicket, type BuyTicketParams } from "../services/buyTicketService";

export function useBuyTicketMutation() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (payload: BuyTicketParams) => buyTicket(payload),
    onSuccess: (result, variables) => {
      if (!result.success) return;
      if (!userId) return;

      queryClient.invalidateQueries({
        queryKey: lotteryListKeys.available(userId),
      });
      queryClient.invalidateQueries({
        queryKey: ["lotteries", "detail", variables.lotteryId, userId],
      });

      // Buying a ticket affects:
      // - wallet balance (debit)
      // - wallet transactions (new debit)
      // - purchased tickets list (new ticket row)
      queryClient.invalidateQueries({
        queryKey: ["wallet", "balance", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "transactions", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "tickets", userId],
      });
      queryClient.invalidateQueries({
        queryKey: homeDashboardKeys.detail(userId),
      });
    },
  });
}

