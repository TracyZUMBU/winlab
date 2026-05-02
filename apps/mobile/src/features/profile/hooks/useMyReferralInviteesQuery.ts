import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { referralKeys } from "../keys/referralKeys";
import { getMyReferralInvitees } from "../services/getMyReferralInvitees";

export function useMyReferralInviteesQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: userId ? referralKeys.invitees(userId) : referralKeys.all,
    queryFn: () => getMyReferralInvitees(),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });
}
