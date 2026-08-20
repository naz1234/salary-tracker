import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  logLevel: "error",
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: process.env.API_PROXY_TARGET
      ? { "/api": { target: process.env.API_PROXY_TARGET, changeOrigin: true } }
      : undefined,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
