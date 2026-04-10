import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  // Use VITE_API_URL from .env files, fallback to localhost for safety
  const backendUrl = env.VITE_API_URL || "http://localhost:3001";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": backendUrl,
        "/uploads": backendUrl,
      },
    },
  };
});
