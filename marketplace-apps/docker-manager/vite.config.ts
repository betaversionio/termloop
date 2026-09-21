import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "DockerManagerApp",
      formats: ["iife"],
      fileName: () => "docker-manager.js",
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: { react: "React" },
      },
    },
  },
});
