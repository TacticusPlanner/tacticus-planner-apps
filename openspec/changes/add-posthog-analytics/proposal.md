## Why

V2 has no product analytics. Every usage question the project can currently answer comes from GA4 on the V1 app — including the review that set V2's initial scope (`tacticus-planner-docs/analytics/reports/2026-06-ga4-high-level-review.md`) — and GA4 does not know V2 exists. There is no way to tell whether the rewrite's navigation, workflows, or page structure are working.

This is the frontend half of adding PostHog. The companion `tacticus-planner-api` change `add-posthog-analytics` adds the pseudonymous identity and the server-side events, and applies first.

## What Changes

- Add `posthog-js` + `@posthog/react` and a new `PostHogProvider` under `apps/web/src/fsd/app/providers/`, mounted in `AppShell` alongside `UserJotProvider`.
- **Track identified users only.** PostHog initializes with capturing opted out, and only opts in once the user is authenticated _and_ their account has resolved. Signing out calls `reset()` and opts back out. No anonymous visitor is ever captured — not a pageview, not a session.
- **No autocapture, no session replay, no default pageview capture.** Every event is explicit and named.
- Identify the user with the `analyticsId` returned by `/me` (new field from the companion API change) — never the raw `applicationUserId`.
- Capture route-level `page_view` events on navigation, carrying `route_group` and `view_mode` properties, mirroring the taxonomy V1 already uses in `tacticusplanner/src/fsd/5-shared/monitoring/analytics.ts` so V1 and V2 traffic stay comparable.
- Add a typed client event module so future events are declared in one place with a documented purpose, per `tacticus-planner-docs/analytics/events-catalog.md`.
- New `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` config across `.env.example` / `.env.local` / `.env.staging` / `.env.production`. The host is `https://us.i.posthog.com` (US Cloud) and must match the API exactly.

### Decisions already taken

| Decision              | Choice                                    | Rationale                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Region                | **US Cloud** (`https://us.i.posthog.com`) | Chosen by the maintainer; must match the API. PostHog has no self-serve migration between clouds, so this is effectively one-way.                                                                                                                                         |
| Who is tracked        | **Identified users only**                 | Anonymous visitors are never captured. This removes the anonymous→identified merge problem entirely, keeps returning-user and retention analysis for the population that matters, and avoids introducing a consent banner into a shell that has anonymous-allowed routes. |
| Autocapture           | **Off**                                   | `tacticus-planner-docs/analytics/privacy-principles.md` requires minimizing collected data and explaining why each event exists. Autocapture — every click and input, unreviewed — is the direct opposite, and would also capture form contents on planner pages.         |
| Identity              | **`analyticsId` from `/me`**              | The raw `applicationUserId` is a v7 GUID whose first 48 bits are the account creation timestamp in plaintext. The browser cannot compute the pseudonymous form itself (that needs a server-held key), so the API supplies it.                                             |
| Initial client events | `page_view` only                          | Deliberately minimal. Route-level views are what the GA4 review actually used to set V2 scope, so this is the smallest event set that makes V2 comparable to V1.                                                                                                          |

## Capabilities

### New Capabilities

- `product-analytics`: client-side product analytics — when PostHog may capture at all, the identified-only lifecycle tied to sign-in and sign-out, the identity it reports, and the privacy floor (no autocapture, no replay, no anonymous capture).

### Modified Capabilities

(none — `userjot-widget`, `silent-sign-in`, and `redirect-authentication` are all unchanged. PostHog observes authentication state but does not alter it.)

## Impact

- New `apps/web/src/fsd/app/providers/posthog-provider.tsx` (+ tests) and a typed event module; both exported through `app/providers/index.ts`.
- `apps/web/src/fsd/app/layout/app-shell.tsx`: `PostHogProvider` mounted in the existing provider stack. Pageview capture keys off the `useLocation()` the shell already reads.
- `apps/web/src/fsd/entities/account/`: the `/me` response type gains `analyticsId` (additive, from the companion API change — the API half must merge first).
- New dependencies `posthog-js` and `@posthog/react`.
- Config: four `.env.*` files gain two variables each. Both values are public, as `VITE_*` variables necessarily are; no secret is introduced on this side.
- **No UI surface.** This change adds no visible component, so it needs no i18n namespace, no `data-testid` targets, and no Joyride tour — unlike most changes in this repo.
- Verification of the identified-only lifecycle requires the full local stack via the workspace Aspire AppHost, since it depends on real MSAL sign-in and a real `/me` response.

### Relationship to the XP Income feature-interest seam

`apps/web/src/fsd/pages/progress/model/xp-income-feature-interest.ts` is a no-op placeholder that was reserved for "the future analytics provider". It is **not** wired up by this change — that page's intent is now served by the UserJot feedback widget, and removing the seam is tracked separately. PostHog does not inherit it.
