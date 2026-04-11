import { loadIntegrationTestEnv } from "@winlab/supabase-test-utils";
import path from "path";

loadIntegrationTestEnv({
  envFilePath: path.resolve(__dirname, "../.env.test.local"),
  optionalEnvFile: true,
  mirrorVitePublicSupabaseEnv: true,
  messageVariant: "admin",
});
