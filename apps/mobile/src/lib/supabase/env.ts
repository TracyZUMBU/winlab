import { Platform } from "react-native";

import { logger } from "../logger";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (__DEV__) {
  if (!SUPABASE_URL) {
    logger.warn(
      "[supabase/env] EXPO_PUBLIC_SUPABASE_URL is not defined. Check your .env or app config.",
    );
  }
  if (!SUPABASE_ANON_KEY) {
    logger.warn(
      "[supabase/env] EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. Check your .env or app config.",
    );
  }
  if (SUPABASE_URL) {
    try {
      const host = new URL(SUPABASE_URL).hostname;
      if (host === "127.0.0.1" || host === "localhost") {
        logger.warn(
          "[supabase/env] EXPO_PUBLIC_SUPABASE_URL points to local Supabase. Start it with `supabase start`, or remove the override in `.env.local` to use cloud.",
          { supabaseUrlHost: host },
        );
      }
    } catch {
      logger.warn(
        "[supabase/env] EXPO_PUBLIC_SUPABASE_URL is not a valid URL.",
      );
    }
  }
}

export const supabaseEnv = {
  url: SUPABASE_URL ?? "",
  anonKey: SUPABASE_ANON_KEY ?? "",
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  platform: Platform.OS,
};
