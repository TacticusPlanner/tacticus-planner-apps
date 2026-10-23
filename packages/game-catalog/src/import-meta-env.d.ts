// The one build-time variable this package reads (icons/asset-path.ts). The package is only ever
// bundled by Vite (apps/web, whose vite-env.d.ts declares the same field) or run under Vitest.
interface ImportMetaEnv {
  readonly VITE_GAME_ASSETS_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
