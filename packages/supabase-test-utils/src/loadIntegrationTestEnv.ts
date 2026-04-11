import dotenv from "dotenv";
import fs from "fs";

export type LoadIntegrationTestEnvOptions = {
  /** Chemin absolu vers `.env.test.local` (souvent `path.resolve(__dirname, "../.env.test.local")`). */
  envFilePath: string;
  /**
   * Si true : charge le fichier seulement s’il existe (variables déjà dans le shell possibles, ex. CI).
   * Si false : `dotenv.config` est toujours appelé — le fichier doit exister ou l’appel échoue.
   */
  optionalEnvFile?: boolean;
  /** Admin : copie `SUPABASE_*` vers `VITE_SUPABASE_*` pour Jest / `getSupabaseClient`. */
  mirrorVitePublicSupabaseEnv?: boolean;
  /** Mobile : refuse toute variable `EXPO_PUBLIC_*` dans `process.env` (mauvaise config de test). */
  rejectExpoPublicKeys?: boolean;
  /** Forme des messages d’erreur pour clés manquantes. */
  messageVariant?: "admin" | "mobile";
};

function missingKeyMessage(
  name: string,
  variant: "admin" | "mobile",
): string {
  if (variant === "admin") {
    return `${name} is missing. Add apps/admin/.env.test.local or export ${name} (local Supabase only).`;
  }
  return `${name} is missing in .env.test.local`;
}

/**
 * Charge l’environnement pour les tests d’intégration Supabase **local uniquement**.
 * À appeler depuis le `setupEnv.ts` de chaque app (Jest `setupFiles` / `setupFilesAfterEnv`).
 */
export function loadIntegrationTestEnv(
  options: LoadIntegrationTestEnvOptions,
): void {
  const {
    envFilePath,
    optionalEnvFile = false,
    mirrorVitePublicSupabaseEnv = false,
    rejectExpoPublicKeys = false,
    messageVariant = "mobile",
  } = options;

  if (optionalEnvFile) {
    if (fs.existsSync(envFilePath)) {
      const result = dotenv.config({ path: envFilePath });
      if (result.error) {
        throw new Error(
          `Failed to load ${envFilePath}: ${result.error.message}`,
        );
      }
    }
  } else {
    const result = dotenv.config({ path: envFilePath });
    if (result.error) {
      throw new Error(`Failed to load ${envFilePath}: ${result.error.message}`);
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(missingKeyMessage("SUPABASE_URL", messageVariant));
  }
  if (!supabaseAnonKey) {
    throw new Error(missingKeyMessage("SUPABASE_ANON_KEY", messageVariant));
  }
  if (!supabaseServiceRoleKey) {
    throw new Error(
      missingKeyMessage("SUPABASE_SERVICE_ROLE_KEY", messageVariant),
    );
  }

  if (!supabaseUrl.includes("http://127.0.0.1")) {
    throw new Error(
      `Refusing to run integration tests against non-local Supabase URL: ${supabaseUrl}`,
    );
  }

  if (rejectExpoPublicKeys) {
    if (Object.keys(process.env).some((k) => k.startsWith("EXPO_PUBLIC_"))) {
      throw new Error(
        "Integration tests must not rely on EXPO_PUBLIC_* env vars; use SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY from .env.test.local",
      );
    }
  }

  if (mirrorVitePublicSupabaseEnv) {
    process.env.VITE_SUPABASE_URL = supabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;
  }
}
