# Design

## Context

See proposal.md - Why. Vite 8.3 builds through Rolldown, so chunking is configured with `build.rollupOptions.output.advancedChunks` (Rolldown's replacement for `manualChunks`) and `build.modulePreload.resolveDependencies` caps the preload list. React Router 8 runs in data mode (`createBrowserRouter`), so every route can carry a `loader`. Hosting is Azure Static Web Apps; headers come from `apps/web/public/staticwebapp.config.json`, which matches on path only (query strings are ignored). Locale URLs already carry `?v=<commit sha>` (`VITE_APP_VERSION`, set in `_build-web.yml`). Icon URLs are built in `packages/game-catalog/src/game-entities/icons/asset-path.ts` from `ASSET_BASE_PATH`.

## Goals / Non-Goals

**Goals:**

- Entry JavaScript on the anonymous Library path and on `/home` drops by at least 40% against the recorded baseline; modulepreload links drop from 80 to at most 20.
- A page's chunk request starts at route match, concurrently with `GET /me`.
- Unchanged locale files and images produce zero requests on a warm load.
- A size regression fails CI.

**Non-Goals:**

- Deferring MSAL. Silent restore runs before first render for every route (`src/main.tsx`), so `@azure/msal-browser` stays in the entry graph; it is the floor under the budget.
- Offline support, service worker, i18n Suspense fallback, theme flash (`client-baseline-hardening`), ability-text namespaces (`lazy-load-rules-text`), query freshness and sync concurrency (`tune-client-query-caching`).
- Responsive `srcset` variants. One WebP per asset at a sensible maximum size is enough for icons rendered at fixed CSS sizes.

## Decisions

1. **Analytics: dynamic `import("posthog-js")` on identification, drop `@posthog/react`.** `AnalyticsProvider` keeps its context shape (`identifyUser`, `clearIdentity`, `captureEvent`) but holds a `PostHog | null` client loaded in an effect when `VITE_POSTHOG_PROJECT_TOKEN` is set _and_ an analytics id is present; `PostHogIdentity`'s identify and page-view effects depend on the client, so the first page view fires once the client exists. Sign-out before load sets a cancelled flag so the resolved import is discarded. Alternative: keep `@posthog/react` behind `React.lazy` - rejected, a Suspense fallback around the provider would remount the whole shell when the SDK resolves.
2. **Tour: split provider from runner.** `TourProvider` keeps the context (registered page steps, `startTour`, `isRunning`) with no react-joyride import; a `TourRunner` component, `React.lazy`-loaded inside the provider and rendered only when a tour has been requested or a first-run auto-start is pending, owns `useJoyride`. `Step` types stay as type-only imports (erased). Alternative: lazy-load per page tutorial - rejected, the runtime is the weight, not the step arrays.
3. **Sync code behind a subpath.** `@workspace/game-catalog` and `@workspace/player-data` gain `"./sync": "./src/sync.ts"` exporting the HTTP client, `sync*` function and schemas; the two providers `await import("@workspace/game-catalog/sync")` inside their run function. The root index keeps types, storage and icon helpers only. Alternative: Vite `optimizeDeps`/tree-shaking - rejected, zod schemas are reachable from the root barrel so they are kept.
4. **Route preloading with sync loaders, no restructuring.** Each `React.lazy` page keeps its import factory in a named constant; the matching route gets `loader: () => { void factory(); return null }`. The router runs loaders at match time (initial load and navigations) and a synchronous `null` never blocks render, so the chunk downloads while `OnboardingGate` waits for `GET /me`. Applied to `routes.tsx` and to every `pages/*/route.tsx` child so nested layouts stop adding a round trip. Alternative: route `lazy` - rejected, the router waits for `lazy` to resolve before rendering, which would serialise the chunk _before_ `/me` instead of after. Alternative: render children behind the gate - rejected, the gate's comment documents the 404 race on first-time provisioning.
5. **dnd-kit and cmdk at the component boundary.** `shared/ui/sortable-list.tsx` becomes a thin wrapper that `React.lazy`-loads the dnd-kit implementation and renders a plain list until it resolves (same markup, no drag affordance for the few hundred ms); the barrel export is unchanged. cmdk reaches every route through `@workspace/ui/components/command` imported by the shell's desktop navigation search; the search dialog content is `lazy`-loaded on first open. Done only after the visualizer confirms which modules sit in shared initial chunks.
6. **Chunking and preload policy.** `advancedChunks.groups`: `react` (`react`, `react-dom`, `react-router`, `scheduler`), `msal` (`@azure/msal-*`), `radix` (`@radix-ui/*`), `i18n` (`i18next*`, `react-i18next`). Vendor chunks then keep stable hashes across app deploys. `modulePreload.resolveDependencies` keeps a dependency only if it is in the entry's static graph, and the budget script asserts at most 20 preloads. Alternative: default Rolldown heuristics - rejected, they produced the 792 KB `main`.
7. **Measurement without new runtime dependencies.** `build.manifest: true`; a small `apps/web/scripts/bundle-budget.mjs` walks `dist/.vite/manifest.json` from the `index.html` entry through static `imports` (the shared startup graph) and, for each budgeted route, additionally from that route's page module (`src/fsd/pages/<x>/…` as the manifest key, reached through the entry's `dynamicImports`) through its static `imports`; it sums the bytes per route, counts preloads in `dist/index.html` and exits non-zero over budget (`BUNDLE_BUDGET_KB` for the shared graph and a per-route table for `/`, `/home` and `/library/characters` in the script, initial values = post-change measurement + 5%). Route chunks are dynamic imports, so a budget on the static graph alone would not see a page chunk regress. `rollup-plugin-visualizer` is added as a dev dependency only after confirming it runs under Rolldown; it is enabled by `ANALYZE=1` and its `stats.html` is uploaded as a CI artifact. If it does not run under Rolldown, composition is read from `vite build --sourcemap` with an ad-hoc `npx source-map-explorer` and no dependency is added.
8. **Caching by version stamp, no hashing pipeline.** `staticwebapp.config.json` gains `/locales/*` and `/game_catalog/*` routes with `public, max-age=31536000, immutable`. Locales are already stamped per build. Catalog images get `?v=<asset version>` where the version is the git tree hash of `apps/web/public/game_catalog` (`git rev-parse HEAD:apps/web/public/game_catalog`), computed once in `vite.config.ts` into `define`/`import.meta.env.VITE_GAME_ASSETS_VERSION`, with a dev fallback of `dev`. The tree hash changes only when a file under the folder changes, so no one has to remember to bump anything. Alternative: content-hashed file names via a Vite plugin or an asset manifest - rejected, 2,454 files referenced by id-derived paths would need a lookup table at runtime for no additional cache benefit.
9. **WebP by one-time script, committed output.** A throwaway script run locally (`npx @squoosh/cli` or `sharp` via `npx`, nothing added to `package.json`) converts every PNG under `public/game_catalog` to WebP (quality 82, max edge 256 px for `characters`, `npcs`, `mows`, `equipment` and `upgrades`; untouched dimensions elsewhere), the PNGs are deleted, and the icon helpers plus their tests switch extensions. The maximum edge is verified against the largest rendered size before converting; a folder whose largest render exceeds 256 px keeps its native size. `public/logo.png` is deleted (no references). `public/favicon.svg` is replaced by a hand-sized vector (target under 20 KB) or, failing that, by the existing `web-app-manifest-192x192.png` for the header logo. Alternative: a Vite image plugin - rejected, the assets are static and change only with catalog bumps.
10. **Explicit image dimensions where CSS does not fix the box.** `EntityIcon` accepts optional `width`/`height` passthrough; the audit lists `<img>` elements whose parent has no fixed size class and adds the attributes there only.

## Risks / Trade-offs

- [Rolldown option names differ from Rollup's] -> read `apps/web/node_modules/vite/dist/node/index.d.ts` for `advancedChunks` and `resolveDependencies` before writing config; the build fails loudly on unknown options.
- [A tour auto-start on first run now waits for the runner chunk] -> the runner is requested as soon as `TourProvider` decides a tour is pending, typically well under one round trip before the target element is painted; verified manually on `/home` first run.
- [First page view after identification is reported a few hundred ms later] -> acceptable, the spec already allows capture to begin only once identified; no event is lost because nothing is captured before the client exists.
- [Immutable images with a stale version in a long-lived tab] -> the version is baked at build time; a stale tab already shows the old build's code, and the existing stale-build recovery reloads on the next chunk miss.
- [Large diff from committing 2,454 WebP files] -> one dedicated commit, no code in it; reviewers skip it.
- [Sortable list briefly renders without drag handles] -> under 100 ms on broadband; the fallback keeps the same DOM so tests and tours see the same test ids.
- [`advancedChunks` groups can pull a module into a vendor chunk that only one route uses] -> groups are limited to the four always-loaded vendors; everything else follows the import graph.

## Migration Plan

Client-only, no flag. Order: measurement baseline first, then chunking and preload policy, then the four lazy boundaries, then caching and images; each lands as its own PR and reruns the budget script. Rollback is a revert; the only persistent artefacts are the WebP files and the removed PNGs, which can be restored from git.

## Open Questions

- Whether `rollup-plugin-visualizer` runs under Vite 8's Rolldown. Either answer leaves the budget script and the task list unchanged; it only decides whether `stats.html` or a source-map report is the CI artifact.
