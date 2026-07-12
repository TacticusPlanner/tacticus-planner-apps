import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { coverageConfigDefaults } from "vitest/config"

const aspirePort = process.env.PORT ? Number(process.env.PORT) : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: aspirePort
    ? {
        port: aspirePort,
        strictPort: true,
      }
    : undefined,
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "cobertura"],
      reportsDirectory: "./coverage",
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/index.ts", // barrel re-exports only, no logic of their own
        "**/*.css",
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
    },
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
