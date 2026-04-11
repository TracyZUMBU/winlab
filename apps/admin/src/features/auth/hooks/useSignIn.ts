import { useCallback, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";

export const GENERIC_LOGIN_ERROR =
  "Identifiants incorrects ou compte indisponible. Réessayez.";

const CONFIG_ERROR = "Configuration Supabase manquante.";

export function useSignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(CONFIG_ERROR);
      return { success: false as const };
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(GENERIC_LOGIN_ERROR);
        return { success: false as const };
      }
      return { success: true as const };
    } catch {
      setErrorMessage(GENERIC_LOGIN_ERROR);
      return { success: false as const };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { signIn, isSubmitting, errorMessage };
}
