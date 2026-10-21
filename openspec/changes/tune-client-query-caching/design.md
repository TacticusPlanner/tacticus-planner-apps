# Design

## Context

See proposal.md — Why. All server reads go through TanStack Query (`@/shared/api/api-client.ts`) except the two Dexie-backed syncs (catalog, player data). Query keys are factories per entity (`goalQueries`, `projectQueries`, …). Mutations today mostly invalidate `*.all()`; the LE plan write queue (`use-plan-write-queue.ts`) and the settings/override hooks already follow the response-first pattern this design generalises.

## Goals / Non-Goals

**Goals:**

- Warm navigation between authenticated pages issues zero requests for data fetched within the freshness window.
- One mutation ⇒ one request plus at most the invalidations it logically requires.
- First-visit catalog/player-data download time bounded by the slowest few datasets, not the sum.

**Non-Goals:**

- Removing the `GET me/goals/{id}` fan-out or the per-project `GET me/projects/{id}/goals` joins — those need list payload changes (`rebuild-foundation-pre-launch`).
- Offline support, background sync, service workers.
- Changing Dexie as the store for catalog/player data.

## Decisions

1. **`staleTime` 5 min, `refetchOnMount: false` as the client default**, with `refetchOnReconnect`/`refetchOnWindowFocus` left off. Per-user server data is only ever changed by this client (plus the hourly player-data sync, which already invalidates goals/run-records/plans explicitly in `refresh-after-sync.ts`). Alternative considered: keep `staleTime: 0` and fix only invalidation — rejected, every remount would still refetch every list and every detail.
   - Overrides: `["current-user"]` keeps `staleTime: 0` while `onboarding-gate` is unresolved (setup flow mutates it from another route); `userjot-token` keeps `gcTime: 0`; campaign-events overrides keep their 5 min.
2. **Response-first cache updates.** Every mutation hook calls `setQueryData` with the response for the affected detail key and patches it into any cached list containing that id; then invalidates only what the response cannot describe: `POST me/goals/{id}/status` returns a `GoalDetail` without the order, and Completed/Archived/delete renumber other goals server-side, so those three invalidate the goal lists and the per-project member lists (`projectQueries.details()` prefix); Active↔Paused invalidates nothing; edits/project writes invalidate only the project member lists they named. Pattern already used by `use-plan-write-queue.ts` and `use-planning-settings.ts`; extend it rather than add a new helper. Alternative: optimistic updates everywhere — rejected, the server response already carries the authoritative state and arrives in <100 ms.
3. **Bulk status stays sequential** (`setStatusMany`) but with one invalidation pass at the end instead of per goal; the API bulk endpoint comes with `rebuild-foundation-pre-launch`.
4. **Catalog/player-data downloads run with a concurrency limit of 4** via a small `mapWithConcurrency` in each package's sync module (plain `Promise`/counter, no dependency). Alternative: `Promise.all` unbounded — rejected, 22 parallel multi-MB responses on mobile is worse than 4.
5. **Query-key scoping:** `onslaughtProgressQueries.all()` becomes `["player-data-overrides","onslaught"]` so the prefix no longer covers campaign-events.
6. **Measurement is part of the change:** there is no e2e setup today, so the change adds `@playwright/test` to `apps/web`, a `playwright.config.ts`, a Vitest `test.exclude` for `e2e/**`, and a signed-in storage state captured once by hand (MSAL login cannot be scripted); `apps/web/e2e/request-count.spec.ts` records `/api/` request counts for `/home`, `/plan/goals`, `/plan/projects`, `/dailies/raids`, `/legendary-events/:id` on cold load and on warm re-navigation; the numbers before/after are recorded in the change's tasks notes.

## Risks / Trade-offs

- [Stale data after an out-of-band change, e.g. the same account in two tabs] → bounded by the 5 min window; the hourly player-data sync still forces goal/plan invalidation; acceptable pre-launch, revisit if two-device editing becomes a reported problem.
- [A mutation hook forgets to apply its response and relies on the now-missing broad invalidation] → each hook's test asserts the cache state after `onSuccess`; the request-count e2e catches regressions.
- [Concurrency limit interacts with the Dexie write path] → writes stay sequential per dataset; only the fetches overlap.

## Migration Plan

Client-only; ship behind no flag. Rollback = revert the PR.
