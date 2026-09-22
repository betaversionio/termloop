import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// The CLI's package.json version is the one source of truth for the app's displayed
// version — read it at build time instead of hardcoding a copy here to keep in sync.
const cliVersion = require("../../apps/cli/package.json").version as string;

export default defineConfig({
  // tanstackRouter must run before react() — it transforms route files before the React
  // plugin processes their JSX.
  plugins: [
    tanstackRouter({ target: "react", routesDirectory: "./src/routes", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(cliVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3721",
      "/ws": {
        target: "ws://localhost:3721",
        ws: true,
      },
    },
  },
});
