import { coverageConfigDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "cobertura"],
      reportsDirectory: "./coverage",
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/index.ts", // barrel re-exports only, no logic of their own
        "src/player-data.dto.ts", // type-only re-exports, no logic of its own
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
    },
  },
})
