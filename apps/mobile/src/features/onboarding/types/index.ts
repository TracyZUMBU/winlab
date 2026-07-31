import type { ImageSourcePropType } from "react-native";

type OnboardingSlide = {
  id: "complete-missions" | "earn-tokens" | "win-rewards";
  image: ImageSourcePropType;
};

export type { OnboardingSlide };
