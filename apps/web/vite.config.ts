/// <reference types="vitest/config" />

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./src/fsd/app"),
      "@/pages": path.resolve(__dirname, "./src/fsd/pages"),
      "@/widgets": path.resolve(__dirname, "./src/fsd/widgets"),
      "@/features": path.resolve(__dirname, "./src/fsd/features"),
      "@/entities": path.resolve(__dirname, "./src/fsd/entities"),
      "@/shared": path.resolve(__dirname, "./src/fsd/shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
