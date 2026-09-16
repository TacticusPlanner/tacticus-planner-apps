## Context

See `proposal.md` — Why. Requirements are in `specs/product-analytics/spec.md`. The companion backend change is `add-posthog-analytics` in `tacticus-planner-api`; it applies first and supplies the `analyticsId` this design consumes.

Constraints that shape the approach:

- **The provider stack is already layered.** `main.tsx` mounts `I18nProvider → AuthProvider → QueryProvider → ThemeProvider → TourProvider → TooltipProvider`, and `AppShell` mounts `GameCatalogProvider → PlayerDataProvider → UserJotProvider` inside the router.
- **`UserJotProvider` is the precedent** for an identity-bound third-party integration: it reads `useIsAuthenticated()` and `useCurrentUser()`, reacts to sign-in/sign-out, and guards against stale async identification with a generation counter.
- **Identity requires two independent signals.** MSAL authentication (`useIsAuthenticated()`) and account resolution (`useCurrentUser()`) settle separately. A user can be authenticated while their account record is still loading, or has failed to load.
- **The app has anonymous-allowed routes.** `AppShell` filters nav by `item.anonymousAllowed`, so signed-out users legitimately browse. This is the population that must never be captured.
- **This change adds no UI.** No visible component, so no i18n namespace, no `data-testid` targets, and no Joyride tour — unusual for this repo and worth stating so reviewers do not read their absence as an omission.

## Goals / Non-Goals

**Goals:**

- Make "no capture unless identified" a structural property of initialization, not a condition checked at each call site.
- Keep the vendor SDK behind one module so pages and features never import it.
- Report routes in a form that cannot carry user-specific values.

**Non-Goals:**

- Feature flags or experiments. No flag evaluation is wired on this side.
- Any consent UI. The identified-only posture is what removes the need for one in this change; if anonymous capture is ever introduced, that decision returns.
- Instrumenting individual workflows. Only `page_view` ships here; per-workflow events are follow-on work under the events-catalog discipline.

## Decisions

### Initialize opted out, opt in only on identification

PostHog is initialized once with capture disabled — `opt_out_capturing_by_default: true`, `autocapture: false`, `capture_pageview: false`, `disable_session_recording: true`, `person_profiles: 'identified_only'` — and only opts in after both authentication and account resolution have succeeded.

_Why:_ the spec forbids capturing anonymous visitors, including any activity before sign-in. Initializing in the capturing state and suppressing events afterwards would make every future call site responsible for the check, and the default `capture_pageview` would fire before any of our code runs. Starting opted out makes the anonymous case correct by construction: if the opt-in never happens, nothing is ever sent.

_Alternative considered — defer `init()` until the user is identified._ Rejected: it makes initialization order depend on auth timing, and re-initializing after a sign-out/sign-in cycle on the same page is a worse failure mode than toggling opt-in.

### `PostHogProvider` lives in `AppShell`, not `main.tsx`

It mounts alongside `UserJotProvider`, inside the router and inside `QueryProvider`/`AuthProvider`.

_Why:_ it needs three things that only exist there — `useIsAuthenticated()`, `useCurrentUser()`, and the router location for page views. `main.tsx` is outside the router, so page-view capture would be impossible from there. This also puts the two third-party identity integrations side by side, where their lifecycles can be compared.

### Identity is derived state, not an imperative sequence

A single effect keyed on `[isAuthenticated, analyticsId]` reconciles the desired state: both present → `identify(analyticsId)` then `opt_in_capturing()`; otherwise → `opt_out_capturing()` then `reset()`.

_Why:_ it covers sign-in, sign-out, account-load failure, and user-switching with one rule rather than four handlers. Unlike `UserJotProvider`, no generation counter is needed — `analyticsId` arrives as part of the already-cached account query rather than a separate token fetch, so there is no async window in which a stale identity can land.

_Ordering detail:_ on teardown, opt out _before_ `reset()`. `reset()` assigns a new anonymous id, and opting out afterwards leaves a window in which that fresh anonymous identity could be captured — exactly the anonymous capture the spec forbids.

### Page views report the matched route pattern, never the URL

The captured route is the router's matched path pattern (for example the pattern containing a `:characterId` segment), not `location.pathname`.

_Why:_ the spec forbids reporting route parameters, query strings, and fragments. Planner routes carry entity ids, and lookup routes can carry user-chosen values. Sending the pattern reports which screen was used without reporting what was looked at, and it is also the form that aggregates usefully — one row per screen instead of one per id.

_Alternative considered — send `pathname` with a sanitizer._ Rejected: a denylist of patterns to strip is wrong by default and silently leaks whenever a new parameterized route is added.

### Route group is derived from the navigation structure

`route_group` comes from the resolved top-level nav section — the same `resolveActiveNavigation` result `AppShell` already computes — rather than from splitting the path.

_Why:_ V1 derives its group by string-splitting the first path segment, which works there because the URL structure _is_ the information architecture. V2's nav structure and its URLs are not the same thing, so reusing the string-split idiom would drift from the actual sections as routes are reorganized. Deriving from nav keeps the grouping correct by construction.

### `view_mode` is a property; there is no desktop/mobile behavioral split

This capability renders nothing, so desktop and mobile behave identically — no separate layout, interaction, or tour-target decisions apply. The one place the distinction matters is analytical: `view_mode` is captured as an event property from `useIsMobile()`, because the GA4 review found mobile dominance to be one of the most decision-relevant signals about V2 scope, and V2 needs the same breakdown to stay comparable.

### `shared/analytics` owns the module; `app/providers` owns the lifecycle

The typed event module and the vendor import live in a `shared/analytics` slice with a narrow public API (`captureEvent` plus the declared event types). `PostHogProvider` in `app/providers` consumes it and owns init/identify/reset.

_Why:_ future events will be emitted from pages and features, and FSD forbids importing across those. Putting the module in `shared` gives every layer a legal import path and keeps `posthog-js` imported in exactly one file. Keeping the lifecycle in `app/providers` prevents `shared` from depending on auth state.

### Absent configuration means inert, not broken

With no `VITE_POSTHOG_PROJECT_TOKEN`, initialization is skipped entirely and `captureEvent` becomes a no-op.

_Why:_ `.env.local` is developer-supplied and the test environment has no token. The spec requires the app to run normally without one, and this keeps local development and the Vitest suite free of outbound requests without a separate mocking layer.

## Risks / Trade-offs

- **The opt-out window is only as correct as the effect ordering.** A mistake in the teardown order silently produces the anonymous capture the change exists to prevent → the ordering is stated above, covered by a scenario in the spec, and asserted in tests against a fake client rather than left to review.
- **Ad blockers will suppress an unknown share of client events** → Accepted, and the reason the two events that matter most for adoption are captured server-side instead. Client `page_view` volume should be read as a lower bound, not a count, and should not be compared directly against V1's GA4 absolute numbers.
- **Route patterns are only as safe as the route definitions** → A route that encodes a user value in a static segment would leak it. No current route does; new routes should be considered against this when added.
- **`analyticsId` is a new field the client now depends on.** Deploying apps before the API leaves it undefined → the identity effect treats a missing `analyticsId` exactly like an unresolved account and captures nothing, so the failure mode is "no analytics", not a crash. Apply order is still API first.
- **Identified-only capture means no funnel can ever start before sign-in** → Accepted and intended. Sign-up conversion is not measurable from the client under this posture; `account_registered` from the API is the substitute signal.

## Migration Plan

1. Apply the companion `tacticus-planner-api` change so `/me` returns `analyticsId`.
2. Add `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` (`https://us.i.posthog.com`) to `.env.example`, `.env.local`, `.env.staging`, and `.env.production`. The host must match the API exactly.
3. Apply this change.
4. Verify the identified-only lifecycle against the full local stack via the workspace Aspire AppHost — a standalone Vite server cannot exercise real MSAL sign-in or a real `/me`.

**Rollback:** remove `VITE_POSTHOG_PROJECT_TOKEN` from the deployed environment and rebuild. The app returns to its inert path with no code change.

## Open Questions

- Whether `page_view` should also carry an authenticated-vs-anonymous style property, as V1 does. Under identified-only capture it is constant, so it is omitted here; it becomes meaningful only if the anonymous posture is ever revisited, which would be its own change.
