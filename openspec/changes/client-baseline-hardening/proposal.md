# Proposal

## Why

The client has no global error capture, touches browser storage without guards at boot, keeps identity-provider tokens in long-lived storage behind no security headers, ships the same analytics and feedback project ids to staging and production, and still carries about 5K lines of unrouted Dailies code with its own tests and storage keys. These are the cheapest, lowest-risk findings of the 2026-10-20 client audit and none depends on the larger read-layer, bundle or structure work, so they ship first.

## What Changes

- Unhandled errors and promise rejections are captured once, logged, and reported to the analytics destination when the user is identified; the two background sync loops no longer swallow their outer failures.
- Browser storage access that runs at boot (theme, tour auto-start) and the remaining ad-hoc preference reads go through one no-throw accessor, so a browser that blocks site data still boots and falls back to in-memory defaults.
- **BREAKING** Identity-provider token cache moves from `localStorage` to `sessionStorage`; a non-secret account hint stays on the device so a new tab still restores silently through the existing hidden session check. One module owns restore, token acquisition and a single in-flight interactive redirect; the player-data sync uses it instead of starting its own redirect.
- Static hosting sends `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. Cache headers are untouched (see `trim-startup-bundle`).
- The feedback widget SDK is loaded on demand from app code instead of as an unpinned script in the document head.
- Staging stops reporting into the production analytics and feedback projects.
- The translation bootstrap shows the existing loading indicator instead of a blank page, and the persisted theme is applied before first paint so dark mode no longer flashes light.
- **BREAKING** The unrouted Arena, Onslaught and Salvage Run Dailies pages, engines, tutorials, tests, locale namespaces and persisted keys are deleted (routes were dropped in #174, commit `7753f1ce`). The test-only reset exports in production auth modules are removed. `@tanstack/react-table` becomes a dev dependency (only the ui-kit showcase uses it).

## Capabilities

### New Capabilities

- `client-error-reporting`: what happens to an error that no component or request handler caught — it is logged, reported when the user is identified, and never shown raw or allowed to break the page.
- `browser-storage-resilience`: the app boots and keeps working when browser storage is unavailable, degrading persisted preferences to in-memory defaults.
- `web-security-headers`: the baseline security headers the static host sends on every document.
- `app-startup-rendering`: what the user sees between the entry document and the first rendered route — a loading indicator rather than a blank page, in the persisted theme.

### Modified Capabilities

- `silent-sign-in`: cached tokens are tab-scoped; a new tab restores through the hidden session check using the stored account hint.
- `redirect-authentication`: at most one interactive redirect is started per page load, however many callers hit interaction-required at once.
- `userjot-widget`: the SDK is loaded on demand from app code, after first paint, and never before the app's own entry points can need it.
- `product-analytics`: each deployed environment reports to its own analytics project.
- `dailies-arena-recommendations`: all requirements removed.
- `dailies-onslaught-recommendations`: all requirements removed.
- `dailies-salvage-run-recommendations`: all requirements removed.

## Impact

- `apps/web/src/main.tsx`, `apps/web/index.html`, `apps/web/src/fsd/app/providers/{i18n-provider,posthog-provider,userjot-provider,player-data-provider,game-catalog-provider}.tsx`, `apps/web/src/fsd/shared/{theme/theme-provider,tour/tour-provider}.tsx`, `apps/web/src/fsd/shared/auth/{authentication,silent-sign-in,use-request-api-access-once}.ts`, `apps/web/src/fsd/shared/lib/use-persisted-selection.ts`.
- Deleted: `apps/web/src/fsd/pages/dailies/ui/{arena,onslaught,salvage-run}/`, `apps/web/src/fsd/pages/dailies/model/{arena,onslaught,salvage}-*`, `use-{arena,onslaught,salvage}-recommendations*`, `track-roster*`, `team-recommendation-prefs.ts`, `public/locales/*/{arena,salvageRun}.json` and their types in `i18next.d.ts`.
- `apps/web/public/staticwebapp.config.json`, `apps/web/.env.staging`, `apps/web/package.json`.
- Independent sibling: `tune-client-query-caching` (query freshness, invalidation, download concurrency). No companion `tacticus-planner-api` change.
