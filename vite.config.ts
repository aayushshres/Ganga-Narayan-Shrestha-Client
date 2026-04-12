import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// client/vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Proxy target must be the server origin only (no path).
  // VITE_API_URL includes /api (e.g. http://localhost:3001/api), so we
  // extract just the origin to avoid double /api in proxied requests.
  const apiUrl = env.VITE_API_URL || "http://localhost:3001/api";
  const serverOrigin = (() => {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return "http://localhost:3001";
    }
  })();

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || "/",
    server: {
      proxy: {
        "/api": serverOrigin,
        "/uploads": serverOrigin,
      },
    },
  };
});
