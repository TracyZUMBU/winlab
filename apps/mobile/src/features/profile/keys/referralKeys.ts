/**
 * TanStack Query keys for referral / parrainage data.
 */
export const referralKeys = {
  all: ["profile", "referralInvitees"] as const,
  invitees: (userId: string) => [...referralKeys.all, userId] as const,
} as const;
