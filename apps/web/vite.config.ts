import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { configDefaults, coverageConfigDefaults } from "vitest/config"

const aspirePort = process.env.PORT ? Number(process.env.PORT) : undefined

/**
 * Fills the security headers in the built `staticwebapp.config.json` (spec: web-security-headers):
 * the report-only CSP needs this build's API and PostHog origins, the sha256 of every inline script
 * in the built `index.html`, and the PostHog CSP report endpoint, so staging and production report to
 * their own projects. A build without a PostHog token sends the CSP without a report target.
 */
function securityHeaders(mode: string): Plugin {
  let outDir = "dist"
  return {
    name: "security-headers",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const env = loadEnv(mode, __dirname, "VITE_")
      const origin = (url: string | undefined) => {
        try {
          return url ? new URL(url).origin : null
        } catch {
          return null
        }
      }
      const html = readFileSync(path.join(outDir, "index.html"), "utf8")
      const inlineHashes = [
        ...html.matchAll(/<script>([\s\S]*?)<\/script>/g),
      ].map(
        ([, body]) =>
          `'sha256-${createHash("sha256").update(body).digest("base64")}'`
      )
      const posthog = origin(env.VITE_POSTHOG_HOST)
      const reportUrl =
        posthog && env.VITE_POSTHOG_PROJECT_TOKEN
          ? `${posthog}/report/?token=${env.VITE_POSTHOG_PROJECT_TOKEN}`
          : null
      const userjot = "https://cdn.userjot.com https://*.userjot.com"
      const identity = "https://*.ciamlogin.com"
      const directives = [
        "default-src 'self'",
        `script-src 'self' ${inlineHashes.join(" ")} https://cdn.userjot.com`,
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${userjot}`,
        "font-src 'self' data:",
        [
          "connect-src 'self'",
          origin(env.VITE_API_BASE_URL),
          posthog,
          identity,
          userjot,
        ]
          .filter(Boolean)
          .join(" "),
        `frame-src ${identity} ${userjot}`,
        `form-action 'self' ${identity}`,
        "object-src 'none'",
        "base-uri 'self'",
        ...(reportUrl ? [`report-uri ${reportUrl}`, "report-to posthog"] : []),
      ]
      const configPath = path.join(outDir, "staticwebapp.config.json")
      const config = JSON.parse(readFileSync(configPath, "utf8"))
      config.globalHeaders = {
        ...config.globalHeaders,
        "Content-Security-Policy-Report-Only": directives.join("; "),
        ...(reportUrl
          ? { "Reporting-Endpoints": `posthog="${reportUrl}"` }
          : {}),
      }
      writeFileSync(
        configPath,
        `${JSON.stringify(config, null, 2)}
`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), securityHeaders(mode)],
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
}))
