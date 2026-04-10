import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// client/vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL || "http://localhost:3001";

  return {
    plugins: [react()],
    base: "/Ganga-Narayan-Shrestha-Client/", // ← add this (match your repo name exactly)
    server: {
      proxy: {
        "/api": backendUrl,
        "/uploads": backendUrl,
      },
    },
  };
});
