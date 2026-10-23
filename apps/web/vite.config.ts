import { execFileSync } from "child_process"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { configDefaults, coverageConfigDefaults } from "vitest/config"

// Writes dist/.vite/chunk-packages.json ({ chunk file: [npm package names] }) so
// scripts/bundle-budget.mjs can assert which packages reach the startup graph; the
// Vite manifest lists chunks but not the modules inside them.
function chunkPackages(): Plugin {
  return {
    name: "chunk-packages",
    apply: "build",
    generateBundle(_, bundle) {
      const packages: Record<string, string[]> = {}
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue
        const names = new Set<string>()
        for (const id of chunk.moduleIds) {
          const match = /.*node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(
            id.replaceAll("\\", "/")
          )
          if (match?.[1]) names.add(match[1])
        }
        packages[chunk.fileName] = [...names].sort()
      }
      this.emitFile({
        type: "asset",
        fileName: ".vite/chunk-packages.json",
        source: JSON.stringify(packages, null, 2),
      })
    },
  }
}

// The startup graph is ~90 small chunks (shared modules split by importer set); hinting every one
// of them costs more in contention than it saves. Keep `<link rel="modulepreload">` for the
// largest chunks only: the rest still load through the entry's static imports, a moment later.
// (`build.modulePreload.resolveDependencies` only sees file names, not sizes.)
const MAX_MODULE_PRELOADS = 20

function capModulePreloads(): Plugin {
  return {
    name: "cap-module-preloads",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, { bundle }) {
        if (!bundle) return html
        const sizeOf = (href: string) => {
          const chunk = bundle[href.replace(/^\//, "")]
          return chunk?.type === "chunk" ? chunk.code.length : 0
        }
        const links = [
          ...html.matchAll(
            /\s*<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>/g
          ),
        ]
        const keep = new Set(
          links
            .map((link) => link[1] ?? "")
            .sort((a, b) => sizeOf(b) - sizeOf(a))
            .slice(0, MAX_MODULE_PRELOADS)
        )
        return links.reduce(
          (out, [tag, href]) =>
            keep.has(href ?? "") ? out : out.replace(tag, ""),
          html
        )
      },
    },
  }
}

// Locale files and catalog images are served immutable (public/staticwebapp.config.json), so their
// URLs carry a version (`?v=`) that must change whenever their content can:
// - locales: the commit (VITE_APP_VERSION, set by CI; shared/config/i18n),
// - catalog images: the git tree hash of public/game_catalog, which changes exactly when an image
//   does (packages/game-catalog asset-path.ts).
// Outside a git checkout both fall back to a per-build value, never to a fixed one.
function gitRevision(rev: string): string {
  try {
    return execFileSync("git", ["rev-parse", rev], {
      cwd: __dirname,
      encoding: "utf8",
    })
      .trim()
      .slice(0, 12)
  } catch {
    return `build-${Date.now()}`
  }
}

const aspirePort = process.env.PORT ? Number(process.env.PORT) : undefined

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  if (command === "build") {
    process.env.VITE_APP_VERSION ??= gitRevision("HEAD")
    process.env.VITE_GAME_ASSETS_VERSION ??= gitRevision(
      "HEAD:./public/game_catalog"
    )
  }
  return {
    plugins: [react(), tailwindcss(), chunkPackages(), capModulePreloads()],
    server: aspirePort
      ? {
          port: aspirePort,
          strictPort: true,
        }
      : undefined,
    build: {
      // Read by scripts/bundle-budget.mjs.
      manifest: true,
      rollupOptions: {
        // The MSAL redirect bridge (apps/web/redirect.html) is a standalone, unrouted page — it
        // needs its own build entry so `@azure/msal-browser/redirect-bridge` (a package subpath
        // export, not a browser-loadable URL) gets resolved and emitted as a real asset.
        input: {
          main: path.resolve(__dirname, "./index.html"),
          redirect: path.resolve(__dirname, "./redirect.html"),
        },
        output: {
          // Always-loaded vendors get their own chunks so their hashes survive app deploys; everything
          // else follows the import graph. (Rolldown's replacement for `advancedChunks`.)
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              },
              { name: "msal", test: /node_modules[\\/]@azure[\\/]msal-/ },
              { name: "radix", test: /node_modules[\\/]@radix-ui[\\/]/ },
              {
                name: "i18n",
                test: /node_modules[\\/](i18next[^\\/]*|react-i18next)[\\/]/,
              },
              // Loaded on identification only; the stable name lets stale-build-recovery.ts tell an
              // optional SDK failure from a stale deploy.
              { name: "posthog", test: /node_modules[\\/]posthog-js[\\/]/ },
            ],
          },
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
        {
          find: "@/app",
          replacement: path.resolve(__dirname, "./src/fsd/app"),
        },
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
  }
})
