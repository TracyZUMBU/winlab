import dotenv from "dotenv";
import path from "path";

// Resolve relative to this file so it works regardless of where Jest is launched from.
const envPath = path.resolve(__dirname, "../.env.test.local");

const result = dotenv.config({ path: envPath });
if (result.error) {
  throw new Error(`Failed to load ${envPath}: ${result.error.message}`);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is missing in .env.test.local");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY is missing in .env.test.local");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.test.local");
}

if (!supabaseUrl.includes("http://127.0.0.1")) {
  throw new Error(
    `Refusing to run integration tests against non-local Supabase URL: ${supabaseUrl}`,
  );
}

if (Object.keys(process.env).some((k) => k.startsWith("EXPO_PUBLIC_"))) {
  throw new Error(
    "Integration tests must not rely on EXPO_PUBLIC_* env vars; use SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY from .env.test.local",
  );
}
