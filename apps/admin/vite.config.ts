import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// React + SWC via @vitejs/plugin-react. `define` expose les mêmes clés que le navigateur
// pour éviter `import.meta` dans le code partagé avec Jest.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), "");
  return {
    plugins: [react()],
    define: {
      __ADMIN_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL ?? ""),
      __ADMIN_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? ""),
    },
  };
});
