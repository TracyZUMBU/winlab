import AsyncStorage from "@react-native-async-storage/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";

export const readHasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
    return raw === "true";
  } catch {
    // conservative behavior: if we can't read, we consider that the onboarding has never been seen.
    // if we can't read, we consider that the onboarding has never been seen.
    return false;
  }
};

export const setHasSeenOnboardingTrue = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, "true");
  } catch {
    // don't block the user if the write fails (app still works).
  }
};
