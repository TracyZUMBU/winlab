import AsyncStorage from "@react-native-async-storage/async-storage";

import { DAILY_LOGIN_LAST_COMPLETED_DATE_KEY } from "../constants";

/** Clears device-only daily_login optimization (call on logout / account switch). */
export async function clearDailyLoginLocalCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_LOGIN_LAST_COMPLETED_DATE_KEY);
  } catch {
    // Best-effort only.
  }
}
