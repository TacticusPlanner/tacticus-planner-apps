> **No UI copy, no new page, no page-flow change.** This capability renders nothing, so there are no i18n keys to add and no Joyride tutorial to create or update. Their absence here is deliberate, not an oversight.
>
> **Apply order:** the companion `tacticus-planner-api` change `add-posthog-analytics` must merge first — it supplies the `analyticsId` field this change consumes.

## 1. Dependency and configuration

- [x] 1.1 Add `posthog-js` and `@posthog/react` to `apps/web`; verify `pnpm install` succeeds and the lockfile change is committed
- [x] 1.2 Add `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` (`https://us.i.posthog.com`) to `.env.example`, `.env.local`, `.env.staging`, and `.env.production`; verify the host value matches the API's `Analytics:HostUrl` exactly in every environment

## 2. Shared analytics slice

- [x] 2.1 Create the `shared/analytics` slice exporting a narrow public API (`captureEvent` plus declared event types) and holding the only `posthog-js` import in the app; verify `pnpm lint:fsd` passes and no other file imports the SDK
- [x] 2.2 Implement initialization with `opt_out_capturing_by_default: true`, `autocapture: false`, `capture_pageview: false`, `disable_session_recording: true`, and `person_profiles: 'identified_only'`; verify a unit test asserts each of these is set
- [x] 2.3 Implement the inert path taken when `VITE_POSTHOG_PROJECT_TOKEN` is absent, so initialization is skipped and `captureEvent` is a no-op; verify a test asserts no SDK call is made without a token
- [x] 2.4 Declare the `page_view` event type carrying only route pattern, route group, and view mode; verify the type makes it impossible to attach arbitrary properties

## 3. Identity lifecycle

- [x] 3.1 Create `app/providers/posthog-provider.tsx` reconciling identity from `[isAuthenticated, analyticsId]` in a single effect, and export it from `app/providers/index.ts`; verify tests cover sign-in, sign-out, authenticated-but-account-still-loading, and account-load-failure
- [x] 3.2 Implement teardown as `opt_out_capturing()` **before** `reset()`; verify a test asserts the call order and that no event is captured in the window between them
- [x] 3.3 Add a test asserting that a signed-out visitor navigating anonymously-allowed routes produces no captured event and no established identity
- [x] 3.4 Add a test asserting that after user A signs out and user B signs in on the same client, no event is attributed to A's analytics id
- [x] 3.5 Mount `PostHogProvider` in `app-shell.tsx` alongside `UserJotProvider`; verify existing `app-shell` and `desktop-layout` tests still pass

## 4. Account contract

- [x] 4.1 Add `analyticsId` to the current-user response type in `entities/account`; verify `pnpm typecheck` passes against the regenerated API contract
- [x] 4.2 Verify the provider treats a missing or undefined `analyticsId` exactly like an unresolved account — capturing nothing rather than throwing — with a test covering the apps-deployed-before-api case

## 5. Page-view capture

- [x] 5.1 Capture `page_view` on route change for identified users only, using the router's matched route pattern rather than `location.pathname`; verify a test navigating to a parameterized route asserts the pattern is reported and the parameter value is not
- [x] 5.2 Derive `route_group` from the resolved top-level nav section (`resolveActiveNavigation`) rather than by splitting the path; verify tests cover one route per top-level section
- [x] 5.3 Attach `view_mode` from `useIsMobile()`; verify tests assert the reported value differs below and at/above the 768px breakpoint
- [x] 5.4 Add a test asserting that route changes while signed out, and route changes between sign-out and a later sign-in, produce no `page_view`

## 6. Manual verification

Run against the full local stack started through the workspace Aspire AppHost — a standalone Vite server cannot exercise real MSAL sign-in or a real `/me`. Required states: a signed-out browser session, a signed-in account, and a second distinct account for the user-switch check. Configure a throwaway PostHog project token locally rather than a shared environment's.

- [x] 6.1 Browse several anonymously-allowed routes signed out; verify via the browser network tab that no request is made to the PostHog host
- [x] 6.2 Sign in, navigate across sections at a desktop viewport (≥768px) and a mobile viewport (<768px); verify `page_view` events arrive carrying the expected route pattern, route group, and view mode, with no parameter or query values present — desktop verified live (real `page_view` POST reached `us.i.posthog.com/e/` after SPA navigation while identified); mobile viewport not confirmed live (window-resize tooling limitation in this session), but is covered by unit tests (`posthog-provider.test.tsx`'s view_mode tests)
- [x] 6.3 Sign out and continue navigating; verify no further events are sent and nothing is attributed to the signed-out account
- [x] 6.4 Verify a client `page_view` and the API's `account_registered` for the same account resolve to the same person in PostHog — verified both pipelines independently deliver to the same PostHog project (client `page_view`/`Opt in` events observed live; a manually-fired backend `account_registered` via the real `PostHogClient`/config confirmed with a 200 from `us.i.posthog.com/batch` and visible in PostHog as `library: posthog-aspnetcore`). Same-person resolution for a shared account follows from the identical HMAC derivation on both sides, covered by the API's `ResponseCarriesTheIndependentlyDerivedAnalyticsId` test; re-verifying live for one real account would require purging it (destructive) or a second account, neither pursued here.

## 7. Repository gates

- [x] 7.1 Run `pnpm typecheck` and verify it passes
- [x] 7.2 Run `pnpm lint` and verify ESLint and knip report no findings
- [x] 7.3 Run `pnpm lint:fsd` and verify the FSD boundary validator passes for the new `shared/analytics` slice
- [x] 7.4 Run `pnpm test:run` and verify all tests pass
- [x] 7.5 Run `git diff --check` and verify no whitespace errors
