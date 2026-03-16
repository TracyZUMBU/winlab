import { Platform } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (__DEV__) {
  if (!SUPABASE_URL) {
    console.warn(
      "[supabase/env] EXPO_PUBLIC_SUPABASE_URL is not defined. Check your .env or app config.",
    );
  }
  if (!SUPABASE_ANON_KEY) {
    console.warn(
      "[supabase/env] EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. Check your .env or app config.",
    );
  }
}

export const supabaseEnv = {
  url: SUPABASE_URL ?? "",
  anonKey: SUPABASE_ANON_KEY ?? "",
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  platform: Platform.OS,
};
