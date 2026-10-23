import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { configDefaults, coverageConfigDefaults } from "vitest/config"

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
  build: {
    rollupOptions: {
      // The MSAL redirect bridge (apps/web/redirect.html) is a standalone, unrouted page — it
      // needs its own build entry so `@azure/msal-browser/redirect-bridge` (a package subpath
      // export, not a browser-loadable URL) gets resolved and emitted as a real asset.
      input: {
        main: path.resolve(__dirname, "./index.html"),
        redirect: path.resolve(__dirname, "./redirect.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
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
    alias: [
      // Resolve the shared UI package from source so dev, typecheck and tests need no prior
      // `packages/ui` build. `@workspace/ui/globals.css` keeps resolving through its export.
      {
        find: /^@workspace\/ui\/(components|hooks|lib)\/(.*)$/,
        replacement: path.resolve(__dirname, "../../packages/ui/src/$1/$2"),
      },
      { find: "@/app", replacement: path.resolve(__dirname, "./src/fsd/app") },
      {
        find: "@/pages",
        replacement: path.resolve(__dirname, "./src/fsd/pages"),
      },
      {
        find: "@/widgets",
        replacement: path.resolve(__dirname, "./src/fsd/widgets"),
      },
      {
        find: "@/features",
        replacement: path.resolve(__dirname, "./src/fsd/features"),
      },
      {
        find: "@/entities",
        replacement: path.resolve(__dirname, "./src/fsd/entities"),
      },
      {
        find: "@/shared",
        replacement: path.resolve(__dirname, "./src/fsd/shared"),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
})
