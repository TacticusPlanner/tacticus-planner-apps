# Tasks

## 1. Baseline and measurement tooling

- [ ] 1.1 Record the baseline in this file's notes: run `pnpm --filter web build:production`, count `modulepreload` links in `dist/index.html`, list the ten largest `dist/assets/*.js` files, and run Lighthouse (mobile, simulated throttling) on signed-out `/library/characters` and signed-in `/home` noting LCP, TBT and transferred JS bytes; verify the note holds all six figures.
- [ ] 1.2 Enable `build.manifest: true` in `apps/web/vite.config.ts` and add `apps/web/scripts/bundle-budget.mjs` that sums the `index.html` entry's static import graph from `dist/.vite/manifest.json`, counts preloads in `dist/index.html`, and exits non-zero when bytes exceed `BUNDLE_BUDGET_KB` or preloads exceed 20; verify it passes on the baseline with the budget set to the baseline and fails when the budget is set lower.
- [ ] 1.3 Check whether `rollup-plugin-visualizer` runs under Vite 8 (Rolldown): if yes, add it as a dev dependency gated by `ANALYZE=1` and verify `ANALYZE=1 pnpm --filter web build` writes `dist/stats.html`; if no, document `vite build --sourcemap` plus `npx source-map-explorer` in the script's header comment instead and add no dependency.
- [ ] 1.4 Add a "Bundle budget" step after Build in `.github/workflows/_build-web.yml` running `node apps/web/scripts/bundle-budget.mjs`, and upload `dist/stats.html` (or the source-map report) as a CI artifact; verify by pushing a branch and checking the workflow run shows the step and the artifact.

## 2. Vendor chunking and preload policy

- [ ] 2.1 Configure `build.rollupOptions.output.advancedChunks.groups` in `apps/web/vite.config.ts` for `react`, `msal`, `radix` and `i18n` (option names confirmed against `apps/web/node_modules/vite/dist/node/index.d.ts`); verify the build emits those four named chunks and the `redirect.html` entry still resolves `@azure/msal-browser/redirect-bridge`.
- [ ] 2.2 Add `build.modulePreload.resolveDependencies` keeping only the entry's static graph; verify `dist/index.html` preload count drops and `bundle-budget.mjs` still passes.
- [ ] 2.3 Record the post-chunking figures (same six as 1.1) in the notes and verify no route fails to load by visiting `/`, `/home`, `/plan/goals`, `/dailies/raids`, `/library/characters`, `/legendary-events` in the built app served by `pnpm --filter web preview`.

## 3. Lazy analytics SDK

- [ ] 3.1 Replace `@posthog/react` in `src/fsd/shared/analytics/analytics-provider.tsx` with a context holding a `PostHog | null` client created by `await import("posthog-js")` only when a project token is configured and an analytics id is present, with cancellation on sign-out; remove `@posthog/react` from `apps/web/package.json`; verify `pnpm install` and `pnpm typecheck` pass.
- [ ] 3.2 Make `PostHogIdentity`'s identify and page-view effects depend on client availability so the current route's page view is reported once the client exists; update `posthog-provider.test.tsx` and `analytics-provider` tests to cover the four scenarios in `specs/product-analytics/spec.md` (signed-out visitor loads no SDK, identification loads SDK and reports the page view once, blocked download is silent, sign-out before load discards the client); verify `pnpm --filter web test:run -- analytics posthog` passes.
- [ ] 3.3 Verify in the built app that a signed-out visit to `/library/characters` makes no request for a posthog chunk or to the analytics host, and that after sign-in the chunk loads and one `page_view` is sent (network panel), noting the result here.

## 4. Lazy tour runner

- [ ] 4.1 Split `src/fsd/shared/tour/tour-provider.tsx` into the context provider (no react-joyride runtime import) and a `React.lazy` `TourRunner` that owns `useJoyride`, rendered only when a tour is requested or a first-run auto-start is pending; keep `TourPageSteps` and `useTourPageSteps` unchanged; verify `tour-provider.test.tsx` passes with the lazy boundary (await the runner in tests).
- [ ] 4.2 Verify `react-joyride` is absent from the entry graph (`bundle-budget.mjs` output or the bundle report) and that the general tour and one page tour (`/home`) still start and step correctly on desktop (>=768px) and mobile (<768px, same-origin iframe per `tp-manual-ui-verification`), noting the result here.

## 5. Sync code behind package subpaths

Moved to `catalog-read-layer` task 2.6: that change replaces both providers and both sync loops with one engine, so the `./sync` subpath and the dynamic import land there in the same rewrite. The bundle-report budget in group 7 still asserts that `zod` is absent from the entry graph once `catalog-read-layer` has landed.

## 6. Route module preloading

- [ ] 6.1 In `src/fsd/app/routes.tsx` hold each page import factory in a constant and add `loader: () => { void factory(); return null }` to its route; apply the same to the nested `lazy()` routes in `src/fsd/pages/{dailies,goals,guild,legendary-events,library,my-game}/route.tsx`; verify `pnpm typecheck` passes and existing route tests still render.
- [ ] 6.2 Verify in the built app (network panel, signed in, cold cache) that the `/home` page chunk request starts before `GET /api/v1/me` completes and that `/plan/goals` requests its layout and page chunks concurrently, noting the request start offsets here.

## 7. Component-boundary loading for dnd-kit and cmdk

- [ ] 7.1 Confirm from the bundle report which initial chunk holds `@dnd-kit/*` and `cmdk`; if neither is in the entry graph after groups 2 to 6, record that and skip 7.2 and 7.3.
- [ ] 7.2 Make `src/fsd/shared/ui/sortable-list.tsx` a wrapper that `React.lazy`-loads the dnd-kit implementation and renders the same list markup without drag handling as the fallback; verify `sortable-list` tests and the goals board / LE teams tests pass with the boundary, and that `@dnd-kit` leaves the entry graph.
- [ ] 7.3 Lazy-load the navigation search dialog content (the `@workspace/ui/components/command` consumer in `src/fsd/app/layout/desktop-top-bar.tsx` / `desktop-layout.tsx`) on first open; verify the desktop shortcut still opens search (`app-navigation` tests) and `cmdk` leaves the entry graph.

## 8. Static asset caching

- [ ] 8.1 Add `/locales/*` and `/game_catalog/*` routes with `Cache-Control: public, max-age=31536000, immutable` to `apps/web/public/staticwebapp.config.json` (leave `globalHeaders` and the security-header work to `client-baseline-hardening`); verify the JSON parses and the existing `/assets/*` and `/redirect.html` routes are unchanged.
- [ ] 8.2 Compute `VITE_GAME_ASSETS_VERSION` in `apps/web/vite.config.ts` from `git rev-parse HEAD:apps/web/public/game_catalog` (fallback `dev`), declare it in `src/vite-env.d.ts` and `turbo.json` inputs if needed, and append `?v=` to every URL built in `packages/game-catalog/src/game-entities/icons/asset-path.ts`; update the icon tests; verify `pnpm --filter @workspace/game-catalog test:run` passes and a built image URL carries the version.
- [ ] 8.3 Verify on the deployed staging site (or `pnpm --filter web preview` with the SWA CLI) that a warm reload makes zero requests for locale files and catalog images, and that changing `VITE_APP_VERSION` makes the locale files refetch; note the result here.

## 9. Image assets

- [ ] 9.1 Measure the largest rendered size per `public/game_catalog` folder (grep the `size-*`/`h-*` classes on `EntityIcon`, `characterIcon`, `npcPortrait`, `raidBossSplashPortrait` consumers) and record the per-folder max edge here; folders rendered above 256 px keep native dimensions.
- [ ] 9.2 Run a one-off local conversion (no new package.json entry) of every PNG under `apps/web/public/game_catalog` to WebP at quality 82 and the per-folder max edge from 9.1, delete the PNGs, switch the extension in `packages/game-catalog/src/game-entities/icons/*.ts` and their tests, and commit the asset change as its own commit; verify the icon tests pass and `du -sh apps/web/public/game_catalog` is below 40 MB.
- [ ] 9.3 Delete `apps/web/public/logo.png`, replace `apps/web/public/favicon.svg` with a vector under 20 KB (or point `src/fsd/app/layout/app-logo.tsx` and the `<link rel="icon">` at `web-app-manifest-192x192.png` if no clean vector exists); verify `grep -r "logo.png" apps/web` is empty and the header logo and tab icon render.
- [ ] 9.4 Add optional `width`/`height` passthrough to `src/fsd/shared/ui/entity-icon.tsx`, audit `<img>` elements whose parent has no fixed size class and add attributes there; verify Lighthouse CLS on `/library/characters` and `/my-game/collection` is 0.00 and the `static-asset-caching` layout-shift scenario holds.

## 10. Final measurement and gates

- [ ] 10.1 Repeat 1.1 on the finished branch, record the figures next to the baseline, set `BUNDLE_BUDGET_KB` to the measured entry bytes plus 5%, and verify the entry graph is at least 40% smaller than baseline and preloads are at most 20.
- [ ] 10.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and `pnpm --filter web build` and verify all pass.
- [ ] 10.3 Desktop verification (>=768px) in the built app: sign in, visit `/home`, `/plan/goals`, `/dailies/raids`, `/legendary-events`, open navigation search, run the general tour, drag a goal row; verify no console errors and each lazy boundary resolves.
- [ ] 10.4 Mobile verification (<768px, same-origin iframe per `tp-manual-ui-verification`): visit `/home`, `/my-game/collection`, `/library/characters`, open the menu drawer and search, run the general tour; verify portraits render as WebP with no layout shift and no console errors.

## Workflow follow-up

- Archive the change after the budget step has run green on `main` for one deploy.
