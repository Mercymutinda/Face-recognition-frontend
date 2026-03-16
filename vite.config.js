import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./modules", import.meta.url)),
    },
  },
  server: {
    host: true,
    proxy: {
      "/v2": {
        target: process.env.API_BASE_URL || "http://localhost:8000/",
        changeOrigin: true,
      },
    
      CORS: false
    }
  },
});
