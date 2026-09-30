import path from "path"
import { coverageConfigDefaults, defineConfig } from "vitest/config"

export default defineConfig({
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
        // Vendored shadcn primitives: only reached through the small SidebarProvider test, and
        // untested primitives are not part of the gate unless a test imports them.
        "src/components/sidebar.tsx",
        "src/components/sheet.tsx",
        "src/components/separator.tsx",
        "src/components/skeleton.tsx",
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@workspace/ui": path.resolve(__dirname, "./src"),
      "@workspace/ui/components": path.resolve(__dirname, "./src/components"),
      "@workspace/ui/hooks": path.resolve(__dirname, "./src/hooks"),
      "@workspace/ui/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
})
