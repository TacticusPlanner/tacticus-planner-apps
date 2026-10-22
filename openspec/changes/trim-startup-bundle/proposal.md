# Proposal

## Why

Every route, including the anonymous Library pages, downloads about 1.6 MB of minified JavaScript before first paint, and every locale file and game image is revalidated on every load because the static host sends `Cache-Control: no-cache` for everything outside `/assets`. The app is pre-launch, so this is the cheapest moment to fix the startup path before public traffic and before the read-layer and rebuild changes land on top of it.

Evidence (audit 2026-10-20, re-verified 2026-10-21 against `apps/web/dist`):

- `dist/index.html` carries 80 `modulepreload` links; the largest chunks are `main` 792 KB (posthog-js, vaul, sidebar), `api` 293 KB (msal + i18next), `src` 126 KB (zod + every catalog schema), `ui` 104 KB (cmdk + dnd-kit), `import-wrapper-prod` 95 KB (dexie), `hooks` 81 KB, `Configuration` 64 KB (msal), `tour` 63 KB (react-joyride).
- `src/fsd/shared/analytics/analytics-provider.tsx` imports `@posthog/react` statically, so `posthog-js` (336 KB unminified module) is in the entry graph even for signed-out visitors who are never captured.
- `src/fsd/shared/tour/tour-provider.tsx` calls `useJoyride` statically and is mounted in `src/main.tsx` above the router.
- `src/fsd/app/providers/game-catalog-provider.tsx` imports `GameCatalogHttpClient` and `syncGameCatalog` from the `@workspace/game-catalog` root, whose `index.ts` also re-exports `datasetPayloadSchemas` (zod); `@workspace/player-data` has the same shape.
- `src/fsd/app/onboarding-gate.tsx` renders a spinner instead of its children until `GET /me` resolves, so a page's `React.lazy` chunk is not even requested until then; `pages/*/route.tsx` nest a second `lazy()` level, adding another round trip.
- `apps/web/public/staticwebapp.config.json`: global `Cache-Control: no-cache`, immutable only for `/assets/*`; locales are already version-stamped (`?v=<commit>` in `src/fsd/shared/config/i18n/i18n.ts`) but still revalidated.
- `apps/web/public/game_catalog`: 2,454 PNGs, 140 MB, one WebP; `characters/` alone is 581 files, 30 MB, 51 KB average for portraits rendered at roughly 48 to 112 px. `public/logo.png` is 1.4 MB and unreferenced; `public/favicon.svg` is 2.4 MB and is both the favicon and the header logo (`src/fsd/app/layout/app-logo.tsx`).
- `vite.config.ts` has no chunking policy, no bundle report and no size budget; `.github/workflows/_build-web.yml` builds but never measures.

## What Changes

- The analytics SDK is loaded on demand, after the user is identified, instead of being part of the entry bundle; `@posthog/react` is dropped in favour of a dynamic import of `posthog-js`.
- The guided-tour runtime (react-joyride) is loaded only when a tour is about to run.
- Catalog and player-data sync code (HTTP client plus zod schemas) loading only when a sync runs is delivered by `catalog-read-layer` (its `./sync` subpaths); this change only asserts, in the bundle budget, that `zod` is absent from the entry graph once that lands.
- Route page modules start downloading as soon as the route matches, in parallel with the account check and the layout chunk, instead of after `GET /me` resolves; the onboarding gate still withholds rendering until the account is known.
- The drag-and-drop list and the command palette load at their own component boundary rather than through the shared UI barrel on every route.
- Vendor code is split into stable chunks (msal, radix, react) and the module preload list is capped; a bundle report and an initial-JavaScript budget run in CI and fail the build on regression.
- Locale files and game images are served immutable with a version-stamped URL, so a deploy or an asset change still reaches every client while unchanged files are never re-requested.
- Catalog images are converted to WebP (one-time script, converted files committed), the unreferenced 1.4 MB logo is deleted and the 2.4 MB SVG favicon is replaced by a small asset. Images that are not size-constrained by CSS get explicit dimensions.
- The landing page stays eager: its module graph is about 9 KB, so lazy-loading it would cost a round trip for first-time visitors and save nothing measurable.

## Capabilities

### New Capabilities

- `static-asset-caching`: how locale files and game images are cached by the browser and how a deploy or an asset change invalidates them.

### Modified Capabilities

- `product-analytics`: the analytics SDK is not downloaded or initialised until a signed-in user is identified; being unidentified now also means no analytics code reaches the browser.

## Impact

- `apps/web/vite.config.ts`, `apps/web/package.json` (remove `@posthog/react`, add `rollup-plugin-visualizer` as a dev dependency only if it runs under Vite 8's Rolldown), `.github/workflows/_build-web.yml` (bundle report artifact, budget step).
- `src/fsd/shared/analytics/*`, `src/fsd/shared/tour/*`, `src/fsd/app/providers/game-catalog-provider.tsx` and `player-data-provider.tsx`, `src/fsd/app/routes.tsx` and each `pages/*/route.tsx`, `src/fsd/shared/ui/sortable-list.tsx` and the cmdk consumers, `src/fsd/app/layout/app-logo.tsx`.
- `packages/game-catalog/src/game-entities/icons/*` return `.webp` paths with a version query (the `./sync` exports moved to `catalog-read-layer`).
- `apps/web/public/staticwebapp.config.json` (Cache-Control routes only; security headers belong to `client-baseline-hardening`), `apps/web/public/game_catalog/**` (format change), `public/logo.png`, `public/favicon.svg`.
- No API change and no companion `tacticus-planner-api` change. The infra repo is untouched: Azure Static Web Apps reads headers from `staticwebapp.config.json`.
- Siblings: `lazy-load-rules-text` owns the 584 KB and 224 KB ability-text namespaces; `client-baseline-hardening` owns the i18n Suspense fallback, the inline theme script and security headers; `catalog-read-layer` owns both sync loops, so the `./sync` package subpath and the providers' dynamic import moved there (its task 2.6). The remaining items here are independent of every sibling.
