# Proposal

## Why

Several of the heaviest calculations in the client (the daily-raids farming engine, the Goals overview metrics, the Legendary Event page view model, the master table rows) run inside the render body with no memo boundary, so every unrelated re-render (a keystroke in a nearby input, a sync progress tick, a minute clock) re-runs them in full. This change adds memo boundaries and removes the hand-rolled caches that work around the missing ones, without changing what any page shows.

Evidence (audit 2026-10-20, all paths under `apps/web/src/fsd`):

- `features/daily-raids/model/use-daily-raids.ts:338` calls `calculateDailyRaids` in the render body with no `useMemo`; the hook is mounted by `pages/dailies/ui/today-page.tsx:45`, `features/daily-raids/ui/home-screen-event/event-farm-section.tsx:37` (HSE), `features/daily-raids/ui/hre-missions/hre-raids-section.tsx:69` (HRE), `pages/home/ui/raids/raids-widget.tsx:26` and `pages/goals/ui/schedule/schedule-page.tsx`. On HRE the mission-progress inputs are page state (`pages/dailies/ui/hre-page.tsx:53` via `useHreProgress`) and the raids `request` is an object literal rebuilt every render (`hre-page.tsx:127-160`), so each keystroke re-runs the engine; on HSE the projection inputs are page state (`features/home-screen-event-points/model/use-hse-projection-inputs.ts:102-104`) with the same effect on `EventFarmSection`.
- `pages/goals/model/attainment/use-goals-overview-metrics.ts` rebuilds every goal's progress, remaining resources and blockers on every render and then deep-compares the result in `pages/goals/model/shared/use-stable-map.ts`, which calls `setState` during render.
- `pages/goals/model/projects/use-goal-projects.ts:13-16` uses `useQueries` without `combine`, so `queries` is a new array each render and the `useMemo` below it never hits; the memoized goal rows re-render as a result.
- `pages/goals/model/insights/use-plan-insights.ts:97-104` builds a cache key with `JSON.stringify` of the whole inventory chunks on every render and runs the aggregation inside an effect with a hand-rolled `FetchState`.
- `entities/legendary-event/model/use-minute-now.ts` is consumed by `use-legendary-events.ts:14` and `use-legendary-event.ts:22`, so every host of those hooks, including `app/layout/use-nav-items.ts` (the whole shell) and the Legendary Event page, re-renders once a minute even when no lifecycle or countdown changed. `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx:286-330` then rebuilds the page view model (`buildRunStatusViewModel`, `buildRewardOutlookViewModel`, inline handler closures) outside any memo.
- `pages/legendary-events/ui/master-table/master-table-page.tsx:176-183` filters and sorts the rows on every render, and `:257` writes each search keystroke straight into the router search params.
- `app/providers/player-data-provider.tsx:214-223` puts the per-chunk sync `progress` into the same context value as the stable status, so `MobileNavActions` (`app/layout/mobile-layout.tsx:102`) and every other consumer re-render per progress tick. `app/layout/hse-live-provider.tsx:18` passes a fresh object literal as the context value on each of its own minute-tick renders. `app/layout/app-shell.tsx:155,185` passes an un-memoized `launchCreateGoal` to `CreateGoalLauncherProvider`.

## What Changes

- The daily-raids engine result is memoized on its resolved inputs, so a re-render whose inputs are unchanged returns the previous result; the HRE raids `request` is built once per change of its fields; the HSE and HRE sections no longer re-run the engine while the user types in the projection or mission inputs.
- Goals overview metrics are memoized per input set; `useStableMap` is deleted once the memo makes it redundant; `useGoalProjects` uses `useQueries({ combine })` so its result is structurally shared and the goal-row `memo` holds.
- Plan insights drop the `JSON.stringify` cache key and the effect-driven `FetchState` in favor of a memo on stable inputs (the per-entity player reads stay a query; the pure `computePlanInsights` runs in a memo). A Web Worker is explicitly out of scope unless the recorded baseline shows the memoized computation above one frame.
- The minute clock becomes a shared external store with selector subscriptions: lifecycle-reading hooks re-render only when a derived lifecycle actually changes; countdown components subscribe to the raw instant. The Legendary Event page view model and its handlers are memoized.
- Master table rows are memoized on `table`, query, sort and language; the search box keeps local input state and commits to the URL after a short debounce.
- `PlayerDataContext` splits into a stable status context and a progress context; `HseLiveProvider` memoizes its value; the app shell memoizes `launchCreateGoal`.
- No user-visible behavior changes: the same data renders, the same URL parameters are written (the search parameter lands a few hundred milliseconds later), the same events are captured.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- none: this is a render-performance refactor with no requirement-level behavior change, so the change sets `skip_specs: true`.

## Impact

- `features/daily-raids/model/use-daily-raids.ts`, `features/daily-raids/ui/hre-missions/hre-raids-section.tsx`, `pages/dailies/ui/hre-page.tsx`, `features/daily-raids/ui/home-screen-event/event-farm-section.tsx`.
- `pages/goals/model/attainment/use-goals-overview-metrics.ts`, `pages/goals/model/shared/use-stable-map.ts` (deleted), `pages/goals/model/projects/use-goal-projects.ts`, `pages/goals/model/insights/use-plan-insights.ts`, `pages/goals/ui/goals-board/goals-page.tsx`.
- `entities/legendary-event/model/use-minute-now.ts`, `use-legendary-events.ts`, `use-legendary-event.ts`, `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx`, `pages/legendary-events/ui/master-table/master-table-page.tsx`, `master-table-controls.tsx`.
- `app/providers/player-data-provider.tsx`, `shared/player-data-status/player-data-status.ts`, `features/player-data-sync/model/use-player-data-sync-status.ts`, `app/layout/hse-live-provider.tsx`, `app/layout/app-shell.tsx`, `app/layout/use-nav-items.ts`.
- No new dependencies, no API change, no companion `tacticus-planner-api` change. Independent of `tune-client-query-caching` (query freshness) and `catalog-read-layer`. The goals-hook items (`use-goal-projects`, overview metrics, plan insights, `use-stable-map`) are struck: `rebuild-foundation-pre-launch` deletes those fan-outs and files and carries the memo boundaries; this change lands after it (and after `rehome-feature-logic`, so paths are final) and only re-verifies the goals profile. Validation is a React Profiler baseline recorded before and after for each hot path (see design.md).
