export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "complete-missions",
    title: "Complete Missions",
    description:
      "Discover top brands and complete fun tasks to get started on your journey.",
  },
  {
    id: "earn-tokens",
    title: "Earn Tokens",
    description: "Collect tokens for every mission and grow your balance effortlessly.",
  },
  {
    id: "win-rewards",
    title: "Win Rewards",
    description:
      "Use your tokens to join lotteries and unlock exclusive rewards from top partners.",
  },
];

