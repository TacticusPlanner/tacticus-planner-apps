## Context

See proposal.md — Why. Relevant current state:

- `app/index.tsx` builds the router with `createBrowserRouter(routes)`; `app/routes.tsx` has ~30 `lazy()` routes and no `errorElement` anywhere. react-router 8 renders its default error UI for any uncaught error.
- `src/main.tsx` only catches MSAL initialisation failure.
- Vite 8 emits content-hashed chunks; Azure Static Web Apps deletes old assets on deploy. `public/staticwebapp.config.json` sets `no-store` only on `/redirect.html` and excludes `/assets/*` from the SPA fallback, so a missing chunk is a hard 404.
- The game catalog and player data live in Dexie databases with explicit version numbers (`catalogDbVersion = 8`). A newer tab bumping the version closes the older tab's connection; Dexie surfaces that as `DatabaseClosedError` / `VersionError`.
- `onslaughtReward()` throws on a missing row; three `useLiveQuery` consumers treat an empty array as "ready".
- `QueryProvider` sets `retry: false` globally. `OnboardingGate` shows an error card (Retry + Sign out) on any `GET /me` failure, including network errors and `InteractionRequiredAuthError` from `acquireAccessToken()`. `auth-control.tsx` already handles interaction-required by calling `requestApiAccess()` once, but it mounts inside the shell, after the gate, so a gate failure never reaches it.
- `/redirect.html` (MSAL bridge) is `no-store` and references the current hashed bridge script, so silent renew in an old tab still works after a deploy. Verified by reading `vite.config.ts` and the config; left unchanged.

## Goals / Non-Goals

**Goals:**

- One shared classification of "stale-build" errors, used by the route boundary and the preload listener.
- Reload at most once per URL per session; never loop.
- Fallback page is a normal app surface: translated, themed, with Reload / Go to Home, no stack.
- Gate failures that are transient or auth-related never show Sign out as the first option.
- Missing catalog rows degrade to "no Onslaught contribution".

**Non-Goals:**

- Service worker, PWA, or polling for new versions.
- Changing the global TanStack Query retry default (only the current-user query opts in).
- Surfacing build identifiers (OPS-002).
- Any API change.

## Decisions

### D1. Error classification lives in `shared/lib/stale-build.ts`

Both the route boundary (`app/`) and `main.tsx` need the same predicate, and `app` is the top FSD layer, so the helper goes in `shared/lib` and is exported from its barrel. It exposes:

- `isStaleBuildError(error: unknown): boolean` — true for (a) dynamic import failures, matched on the browser messages Vite and browsers produce: `Failed to fetch dynamically imported module` (Chromium), `Importing a module script failed` (WebKit), `error loading dynamically imported module` (Firefox), and any `TypeError` whose message contains `dynamically imported module`; (b) Dexie `DatabaseClosedError`, `VersionError`, and `InvalidStateError` (checked by `error.name`, not `instanceof`, so the helper does not import Dexie into `shared`); (c) errors react-router wraps — the helper unwraps `error.error` / `error.cause` one level.
- `reloadOnceForStaleBuild(): boolean` — reads/writes a `sessionStorage` key `tp:stale-reload:<pathname+search>`; if absent, sets it and calls `location.reload()`, returning true; if present, returns false so the caller shows the fallback page. The key is per URL so a reload on `/plan` does not consume the one attempt for `/dailies`. A successful render clears nothing on purpose: a key is only consulted on failure, and `sessionStorage` dies with the tab.

Alternative considered: a module-level `window.__reloaded` flag — lost on reload, which is exactly when it is needed. `localStorage` — would block the second legitimate reload days later; `sessionStorage` scope is right.

### D2. One `RouteErrorBoundary` component, attached at two levels

`app/route-error-boundary.tsx` uses `useRouteError()`. On mount: if `isStaleBuildError(error)` and `reloadOnceForStaleBuild()` returned true, render nothing (the reload is in flight). Otherwise `console.error` the error and render the fallback page.

It is attached as `errorElement` on (1) the `AppShell` route object, so a failing page keeps the shell's providers out of the blast radius but the page area is replaced, and (2) a new top-level wrapper route (`{ errorElement: <RouteErrorBoundary />, children: routes }`), which catches errors thrown by the shell itself, the landing route, and account setup. Because the fallback page renders inside the router, `useNavigate` works for Go to Home; Reload calls `location.reload()`.

Alternative considered: a classic React `componentDidCatch` boundary around `<RouterProvider>`. It would not catch loader/lazy errors the router already owns, and `useNavigate` is unavailable outside the router.

### D3. Preload failures are handled before React

`main.tsx` adds `window.addEventListener("vite:preloadError", (event) => { if (reloadOnceForStaleBuild()) event.preventDefault() })` before `bootstrap()`. `preventDefault` suppresses Vite's rethrow only when we are reloading; otherwise the error propagates to the router boundary (if mounted) or the existing startup catch.

### D4. `index.html` revalidates on every navigation

Add `{ "route": "/index.html", "headers": { "Cache-Control": "no-cache" } }` to `staticwebapp.config.json`. SWA applies route headers after the `navigationFallback` rewrite, so deep links get the same header. `no-cache` (revalidate) rather than `no-store` so the ETag round trip is still cheap. Hashed assets are untouched.

### D5. `onslaughtReward()` returns `undefined` instead of throwing

Signature becomes `OnslaughtRewardRange | undefined`. Callers:

- `features/goal-farming/lib/goal-acquisition.ts` — `tokensFor()` and `projectOnslaughtSupply()` receive `undefined` and treat it as zero supply (source unavailable), per the `goal-farming-estimates` delta.
- `pages/goals/model/goal-creation-form/use-progression-preview.ts` and `pages/onslaught/ui/onslaught-page.tsx` — render a dash / skip the row.

Readiness in `use-daily-raids.ts`, `use-plan-insights.ts`, `use-per-project-estimates.ts` becomes `onslaughtRewards && onslaughtRewards.length > 0`. The `useLiveQuery` default stays `undefined` (loading), so the only behavioural change is that `[]` is now also "loading".

Alternative considered: return a zero range `{min:0,max:0}`. Hides the distinction between "row says 0" and "no row", which the Onslaught page wants to show differently.

### D6. Current-user query retries transient failures; gate redirects on interaction-required

- `accountQueries.current()` sets `retry: (count, error) => count < 3 && isTransientApiError(error)` and `retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000)`. `isTransientApiError` lives next to `ApiError` in `shared/api`: true for a non-`ApiError` (network/abort-free fetch failure) and for `ApiError.status` 429 or ≥ 500. Auth errors (`InteractionRequiredAuthError`, MSAL timeout) are not transient.
- `OnboardingGate`, on `state.status === "error"` with `isInteractionRequired(error)`, calls `requestApiAccess()` once (same `useRef` guard as `auth-control.tsx`) and renders the loading spinner instead of the card. The redirect flow already returns to the current URL (`redirect-authentication` spec).
- The card keeps Retry primary, Sign out as `variant="ghost"`, and its copy changes to "We couldn't reach the service to check your account" (all four locales).

Alternative considered: raising the global retry default. Rejected — mutations and list queries already handle their own errors and tests assume no retries.

### D7. Where the shared re-auth guard lives

`auth-control.tsx` and `OnboardingGate` now both do "request API access once on interaction-required". Extract `useRequestApiAccessOnce()` into `shared/auth` (it only composes `isInteractionRequired` + `requestApiAccess` + a ref) and use it from both. Keeps FSD direction (both consumers are in `app/`).

## Risks / Trade-offs

- [Message-based detection misses a browser phrasing] → the fallback page still renders with a Reload button, which is the manual path; add new phrasings to the helper's test table when seen.
- [Reload loop on a build that is broken for everyone] → per-URL session marker caps it at one automatic reload; second failure shows the page.
- [`no-cache` on `index.html` adds a revalidation request per navigation] → it is a conditional GET answered 304 by SWA; negligible.
- [Retrying `/me` delays the error card by up to ~15 s during a real outage] → the spinner is already the loading state; acceptable against a 20–40 s API rollout window.
- [Treating `[]` rewards as loading could hide a catalog that legitimately ships no rows] → the dataset has always had rows; if it ever ships empty the init gate's error path is the right place to notice, not Today.
- [Dexie error names change across major versions] → checked by name string with a test; Dexie is pinned.

## Migration Plan

Apps-only, no data migration. Deploy to staging, then run the live verification in tasks §6 across two consecutive staging deploys. Rollback is a normal revert; the `sessionStorage` key is harmless if left behind.

## Open Questions

None that affect the specs or task breakdown. Whether the tester's recurring re-login was the gate (D6) or a chunk failure (D2) is answered by the staging verification, and both paths are covered either way.
