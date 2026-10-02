## Why

Staging and production deploy several times a day, and every deploy strands any tab that was open before it: the next lazy route import 404s (old hashed chunks are deleted), the Dexie catalog connection can be closed by a newer tab's schema upgrade, and a transient `GET /api/v1/me` failure during the API's own rollout lands the user on a gate whose only exits are Retry and Sign out. None of these failures has a handler today — there is no route error boundary at all — so a tester sees react-router's bare "Unexpected Application Error!" page or the account gate, and reads it as "the update broke my login" (batch-3 `OPS-001`, two Discord reports from the same tester on consecutive days). V1 already does better: a root `ErrorBoundary` that recognises a failed chunk import and offers "the app was updated, reload".

## What Changes

- **Route error boundary.** Add an `errorElement` on the root route set and the `AppShell` route. Errors recognised as _stale-build_ (failed dynamic import / `vite:preloadError`, Dexie `DatabaseClosedError` / `VersionError`) trigger exactly one automatic `location.reload()`, guarded by a `sessionStorage` marker so a genuinely broken build cannot loop. Any other error renders a branded, translated "Something went wrong" page with Reload and Go to Home actions and a hint to use the feedback button, instead of react-router's default.
- **Preload failure listener.** `main.tsx` subscribes to Vite's `vite:preloadError` and routes it through the same single-reload guard, so a chunk that fails before React can render still recovers.
- **Entry file never cached.** `staticwebapp.config.json` serves `/index.html` with `Cache-Control: no-cache`, so a plain navigation after a deploy always gets the new entry (hashed assets keep their long cache).
- **Missing Onslaught reward rows degrade instead of crashing.** `onslaughtReward()` returns `undefined` for an unknown sector/tier; the four callers treat that as "no Onslaught contribution" (shards/day 0, source unavailable) rather than throwing through Home. Today and plan-insights readiness additionally wait for a _non-empty_ `onslaught-rewards` dataset so a fresh or mid-sync catalog does not render with `[]`.
- **Onboarding gate resilience.** The gate's `/me` query retries transient failures (network error, 5xx/429) three times with backoff before showing the error card, and an interaction-required auth error triggers the existing in-app re-authentication redirect (`requestApiAccess`) instead of the error card. The card keeps Retry; Sign out stays available but is no longer the first thing a user sees during a 20-second API rollout.
- Not in scope: a service worker / PWA, version polling or "new version available" banners, and the build-version display (`OPS-002`, separate change). The `/redirect.html` silent-renew bridge was examined and is already safe across deploys (`no-store` on the page, which references the current hashed bridge script), so it is unchanged.

## Capabilities

### New Capabilities

- `app-error-recovery`: what the app does when rendering or loading a route fails — stale-build detection with a single guarded reload, the friendly fallback page and its actions, preload-error handling before first render, and the entry-file caching rule that makes a reload actually pick up the new build.
- `onboarding-gate`: how the protected-route gate that waits for `GET /api/v1/me` behaves on failure — transient failures retry automatically before the error card is shown, interaction-required auth errors redirect to re-authentication, and the error card's actions.

### Modified Capabilities

- `daily-raids-today`: readiness now requires a non-empty Onslaught rewards dataset (today an empty array counts as loaded), and a reward row missing for a sector/tier yields no Onslaught contribution rather than an error.
- `goal-farming-estimates`: an Onslaught reward row missing from the catalog for the character's sector/tier SHALL contribute zero Onslaught shards per day (source treated as unavailable) instead of aborting the estimate.

## Impact

- `apps/web/src/fsd/app/`: `routes.tsx` (error elements), new `route-error-boundary.tsx` (+ test), `onboarding-gate.tsx` (+ test), `src/main.tsx` (preload listener).
- `apps/web/src/fsd/shared/`: new stale-build detection + reload guard helper (owning slice for the shared classification, consumed by the boundary and `main.tsx`).
- `apps/web/src/fsd/entities/player-data-override/model/onslaught-rewards.ts` and its four callers in `features/goal-farming`, `pages/goals`, `pages/onslaught`; readiness checks in `features/daily-raids/model/use-daily-raids.ts`, `pages/goals/model/insights/use-plan-insights.ts`, `pages/goals/model/estimate/use-per-project-estimates.ts`.
- `apps/web/src/fsd/entities/account/api/account.queries.ts` (retry policy for the current-user query only; the global `retry: false` default is unchanged).
- `apps/web/public/staticwebapp.config.json`; `apps/web/public/locales/{en,de,es,fr}/common.json` (new `appError.*` keys, revised `accountGate.*` copy).
- No API change. No companion `tacticus-planner-api` change.
