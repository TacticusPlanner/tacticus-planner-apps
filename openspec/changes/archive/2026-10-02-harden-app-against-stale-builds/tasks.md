## 1. Stale-build detection and reload guard

- [x] 1.1 Add `shared/lib/stale-build.ts` with `isStaleBuildError(error)` (dynamic-import messages for Chromium, WebKit, Firefox; Dexie `DatabaseClosedError` / `VersionError` / `InvalidStateError` by `name`; one-level unwrap of `error.error` / `error.cause`) and `reloadOnceForStaleBuild()` (per-URL `sessionStorage` marker, `location.reload()` once); export from `shared/lib/index.ts`. Verify with `stale-build.test.ts`: a table of error samples classifies correctly, the first call reloads and sets the marker, the second call for the same URL returns false, and a different URL reloads again.
- [x] 1.2 Add the `vite:preloadError` listener in `src/main.tsx` before `bootstrap()`, calling `reloadOnceForStaleBuild()` and `preventDefault()` only when a reload was triggered. Verify with a unit test that dispatches a synthetic `vite:preloadError` event and asserts reload + `defaultPrevented` on the first dispatch and neither on the second.

## 2. Route error boundary and fallback page

- [x] 2.1 Create `app/route-error-boundary.tsx`: on a stale-build error that `reloadOnceForStaleBuild()` accepts render nothing; otherwise `console.error` the error and render the fallback page (heading, description, Reload via `location.reload()`, Go to Home via `useNavigate("/home")`, feedback hint) using `common.json` `appError.*` keys. Verify with `route-error-boundary.test.tsx` (memory router with a throwing route): stale error → reload called, no page; generic error → page rendered, console.error called, Go to Home navigates to `/home`, no stack text in the DOM.
- [x] 2.2 Attach the boundary as `errorElement` on the `AppShell` route and on a new top-level wrapper route in `app/routes.tsx` (`{ errorElement, children: [...] }`). Verify the existing route tests still pass and a new test shows a throwing `/dailies` child renders the fallback inside the shell while `/` (landing) errors render the top-level boundary.
- [x] 2.3 Add `appError.title`, `appError.description`, `appError.reload`, `appError.goHome`, `appError.feedbackHint` to `common.json` in en, de, es, fr with real translations at the quality of the sibling keys. Verify the i18n key test / typecheck passes and the de/es/fr files contain no English for these keys.

## 3. Entry-file caching

- [ ] 3.1 Add the `/index.html` route with `Cache-Control: no-cache` to `apps/web/public/staticwebapp.config.json`. Verify after the staging deploy in 6.1 that `curl -I https://staging.tacticusplanner.app/plan` returns `cache-control: no-cache` and `curl -I` on a hashed `/assets/*.js` keeps its long max-age.

## 4. Onslaught rewards degrade instead of crashing

- [x] 4.1 Change `onslaughtReward()` in `entities/player-data-override/model/onslaught-rewards.ts` to return `undefined` for a missing row; update its unit test to assert `undefined` instead of a throw.
- [x] 4.2 Update the four callers: `features/goal-farming/lib/goal-acquisition.ts` (`tokensFor` / `projectOnslaughtSupply` treat `undefined` as zero supply), `pages/goals/model/goal-creation-form/use-progression-preview.ts` and `pages/onslaught/ui/onslaught-page.tsx` (render a dash / skip). Verify with a `goal-acquisition` test for the spec scenario "Reward row missing for the player's sector and tier" (Gold tier 4, no Gold row → zero Onslaught shards, estimate completes) and existing onslaught-page / preview tests.
- [x] 4.3 Change readiness in `features/daily-raids/model/use-daily-raids.ts`, `pages/goals/model/insights/use-plan-insights.ts`, and `pages/goals/model/estimate/use-per-project-estimates.ts` to require `onslaughtRewards.length > 0`. Verify with a `use-daily-raids` test: `[]` rewards → `status: "loading"`; one row → proceeds.

## 5. Onboarding gate resilience

- [x] 5.1 Add `isTransientApiError(error)` next to `ApiError` in `shared/api/api-client.ts` (non-`ApiError` fetch failures, status 429 or ≥ 500) and export it; add `retry` (3 attempts, transient only) and exponential `retryDelay` to `accountQueries.current()`. Verify with `account.queries.test.ts`: network error retried 3× then surfaces; 403 not retried; `InteractionRequiredAuthError` not retried.
- [x] 5.2 Extract `useRequestApiAccessOnce(error)` into `shared/auth` from the existing block in `app/providers/auth-control.tsx`, and use it in both `auth-control.tsx` and `OnboardingGate` (gate renders the spinner, not the card, while the redirect starts). Verify `auth-control` tests still pass and `onboarding-gate.test.tsx` gains: interaction-required error → `requestApiAccess` called once, spinner shown, no card.
- [x] 5.3 Make Retry the primary and first-focused action and Sign out `variant="ghost"` on the gate's error card; update `accountGate.errorTitle` / `errorDescription` copy ("couldn't reach the service…") in en, de, es, fr. Verify `onboarding-gate.test.tsx` asserts the action order/focus and the i18n files have real translations.

## 6. Live verification on staging (two deploys)

- [ ] 6.1 Deploy the change to staging (push to `main` → CD Stage). With a desktop tab (≥768px) open on `/home` from the _previous_ build, deploy a trivial follow-up commit, then click Plan: verify the tab reloads once and lands on `/plan` signed in, with no "Unexpected Application Error" and no sign-in prompt. Repeat with a second tab left open past the access-token lifetime (≥1 h) before the deploy.
- [ ] 6.2 Mobile verification (<768px, via a same-origin iframe on the staging origin per the `tp-manual-ui-verification` skill): repeat 6.1's navigation after a deploy and verify the fallback page, when forced (throw from a dev-only query string is not available, so use DevTools to block one `/assets/*` chunk request), renders the mobile layout with both actions reachable.
- [ ] 6.3 Force a non-stale render error on staging (DevTools: override a catalog response to an invalid shape, or block `/api/v1/me` to exercise the gate) and verify: the branded fallback page appears in the current language with Reload / Go to Home; the gate spinner persists through three retries before the card appears; unblocking during retries renders Home without any card.
- [ ] 6.4 Clear the game-catalog IndexedDB in one tab, open Home: verify Today stays in its loading state until rewards rows exist rather than throwing "Missing Onslaught rewards".

## 7. Quality gates

- [x] 7.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
- [ ] 7.2 Update `tacticus-planner-docs/feedback/batch-3/ACTIVE.md` (OPS-001 → implemented, change name, date) and reply on the OPS-001 UserJot thread once one exists.
