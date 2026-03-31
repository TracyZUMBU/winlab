import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Minimal Vite config: React + SWC via @vitejs/plugin-react.
export default defineConfig({
  plugins: [react()],
});
