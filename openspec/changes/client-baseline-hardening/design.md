# Design

## Context

See proposal.md - Why. Relevant current state:

- Bootstrap: `apps/web/src/main.tsx` awaits `initializeAuthentication()` then renders `I18nProvider > AuthProvider > QueryProvider > ThemeProvider > TourProvider > ...`. `I18nProvider` wraps the tree in `<Suspense fallback={null}>`. The theme class is applied in an effect in `shared/theme/theme-provider.tsx`, so the first paint is unthemed.
- No `error` / `unhandledrejection` listener exists. `game-catalog-provider.tsx` and `player-data-provider.tsx` call `void runSync()` / `void checkAndSyncIfDue()` with no outer catch; the player-data provider calls `requestApiAccess()` itself on interaction-required.
- MSAL is configured with `BrowserCacheLocation.LocalStorage` (`shared/auth/authentication.ts:51`). `silentRestore` is already a module-level promise singleton; `resetSilentRestoreForTesting` and `resetSilentSignInForTesting` are exported from production modules.
- Raw `localStorage` access: `theme-provider.tsx` (state initializer, no guard), `tour-provider.tsx` (effect), `shared/lib/use-persisted-selection.ts` (guarded, versioned, cross-mount), `features/daily-raids/.../use-raids-filters.ts`, `home-screen-event-points/.../use-hse-projection-inputs.ts`, `hre-missions/.../use-hre-progress.ts`, `legendary-event-tokens/.../use-stored-open.ts`, `pages/dailies/model/team-recommendation-prefs.ts` (only consumer: the dead pages).
- `index.html` inlines a UserJot stub and loads `https://cdn.userjot.com/sdk/v3/uj.js` before the app module. `userjot-provider.tsx` waits for the `uj-loaded` event.
- `.env.staging` and `.env.production` carry identical `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_USERJOT_PROJECT_ID`.
- `public/staticwebapp.config.json` sets only `Cache-Control` headers.
- `_build-web.yml` runs prettier, lint, lint:fsd, typecheck, build - no tests. `coverage.yml` runs `pnpm test:coverage` (`vitest --changed` on PRs).
- Dead code: `pages/dailies/ui/{arena,onslaught,salvage-run}`, `pages/dailies/model/{arena,onslaught,salvage}-recommendations*`, `onslaught-shard-recipient*`, `use-{arena,onslaught,salvage}-recommendations*`, `track-roster*`, `team-recommendation-prefs.ts`; locale namespaces `arena.json`, `salvageRun.json` (typed in `i18next.d.ts`). `onslaught.json` may still serve `pages/onslaught` (the routed `/my-game/onslaught` page) and is kept unless proven unused. `@tanstack/react-table` is a production dependency used only by `pages/ui-kit/ui/data-table-showcase.tsx`.

## Goals / Non-Goals

**Goals:**

- Every listed fix is a straight swap or deletion with no new abstraction beyond one `reportError` function and one guarded storage accessor.
- Nothing here changes which requests are made, when data refetches, or what any routed page renders.

**Non-Goals:**

- Query freshness, invalidation and download concurrency (`tune-client-query-caching`).
- A Content Security Policy, report-only or enforcing. Nobody would watch report-only data before launch; launch hardening writes an enforcing policy for the short, known allowlist (self, identity provider, API, PostHog, UserJot) and tries it on staging.
- A toast policy, a unified read-state idiom, or a `usePersistedState` migration of hooks that are not a straight swap (those hooks keep their current shape and only gain the guarded accessor).

## Decisions

1. **One `reportError(error, context)` in `shared/lib`, wired once in `main.tsx`** via `window.addEventListener("error" | "unhandledrejection")`. It `console.error`s, then calls `posthog.capture("client_error", ...)` only if the PostHog provider has identified a user (reuse the existing identified flag/instance from `posthog-provider.tsx`; do not create a second client). Route group comes from the same helper `page_view` already uses. Alternative: an error boundary per provider - rejected, boundaries do not see rejections or listener errors, and the router already has its own fallback (`app-error-recovery`).
2. **Sync loops get `.catch(reportError)` on the outer promise**, nothing else. Their internal status machines already handle expected failures; the catch only covers what escapes.
3. **`safeStorage` = `{ get(key): string | null; set(key, value): void; remove(key): void }` wrapping `localStorage` in try/catch**, placed in `shared/lib`. `theme-provider`, `tour-provider`, `use-persisted-selection`, and the four feature hooks switch their direct `localStorage.*` calls to it (a one-line swap each). `use-persisted-selection` remains the shared cross-mount hook; this change does not introduce `usePersistedState`. Alternative: a `useSyncExternalStore`-based hook replacing all five patterns - deferred; only `use-persisted-selection` has multiple readers of the same key today, and it already syncs them.
4. **MSAL cache: `cacheLocation: SessionStorage`; account hint in `localStorage` under one key** written on successful login/restore (`homeAccountId` + `username`) and removed on logout. Before `PublicClientApplication` is created, `authentication.ts` removes the pre-deploy cache once: every `localStorage` key that starts with `msal.` or contains the MSAL client id (MSAL stores credentials under `<homeAccountId>-<environment>-<type>-<clientId>-…`), leaving other keys untouched. `silent-sign-in.ts` treats "hint present, no account in MSAL" as the hidden-check branch it already has (`ssoSilent` with `loginHint`, 6s timeout). Alternative: keep `LocalStorage` - rejected per the audit's security finding; alternative: no hint - rejected because every new tab would require a click, contradicting `silent-sign-in`.
5. **Single in-flight redirect: `use-request-api-access-once.ts` already dedupes within a component; lift its promise to module scope in `authentication.ts` (`requestInteraction()`), and make the hook and `player-data-provider` both call it.** The provider stops importing MSAL redirect directly.
6. **Static security headers in `staticwebapp.config.json` `globalHeaders`**: `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` (no obsolete `interest-cohort`). No CSP (see Non-Goals). Alternative: a report-only CSP written at build time with per-environment report targets - rejected, ~75 lines of build code for data nobody would read before launch.
7. **UserJot SDK loaded by `userjot-provider.tsx`**: keep the existing `window.uj` proxy stub (moved from `index.html` into the provider module, run at import), inject `<script type="module" src="https://cdn.userjot.com/sdk/v3/uj.js">` once from an effect when `isAuthenticated` becomes true or when `openWidget()` is first called; resolve the existing `uj-loaded` promise on `load`, reject on `error`, and expose `status: "idle" | "loading" | "ready" | "failed"` so entry points can disable with the explanation the spec already requires. `uj.init` moves into the provider with the same options. v3 is the only pinning the vendor offers; recorded as a risk.
8. **Environment ids are configuration, not code.** `.env.staging` gets new `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_USERJOT_PROJECT_ID` values supplied by the user; `posthog-provider` already treats an empty token as "inert", which satisfies the no-fallback scenario.
9. **Blank-page fix: `I18nProvider` renders the existing auth spinner component as the Suspense fallback.** Theme flash: a 4-line inline script in `index.html` `<head>` reads `localStorage.theme` in try/catch, resolves `system` via `matchMedia`, and adds the class to `<html>`; `ThemeProvider` keeps applying on changes. Alternative: SSR or cookies - not applicable to a static SPA.
10. **Deletion scope is exactly the file list in Context plus the two reset exports** (tests that need a reset call the module's existing internals via `vi.resetModules()` instead). `arena.json`/`salvageRun.json` and their `i18next.d.ts` types go; `tour.*` keys for those pages go from every locale. `@tanstack/react-table` moves to `devDependencies` (the ui-kit route is dev-only), the smaller change versus rewriting the showcase.

## Risks / Trade-offs

- [New tab now runs a hidden session check (~1s typical, 6s cap) instead of reading tokens instantly] → acceptable per `silent-sign-in`; measure sign-in-to-shell time before/after in the verification task.
- [Browsers that block third-party cookies make the hidden check fail in every new tab, forcing a click] → same as today's expired-refresh-token path; spec already allows the manual fallback.
- [UserJot v3 URL is mutable; no SRI possible] → documented as accepted vendor risk; the launch-hardening CSP restricts the host.
- [Deleting `team-recommendation-prefs.ts` / `track-roster.ts` breaks a hidden consumer] → grep confirms no non-test consumer outside the deleted pages; `pnpm typecheck` and `pnpm lint:fsd` gate it.

## Migration Plan

Client-only, one PR, no flag. Users signed in before deploy have their `localStorage` MSAL cache removed on first load (decision 4) and go through the silent restore with the hint absent (one-time manual sign-in for existing sessions). Rollback: revert the PR; a rolled-back build recreates its cache on the next sign-in.

## Open Questions

- None.
