# Design

## Context

See proposal.md - Why. React 19 with the compiler not enabled; memoization is explicit. The heavy pure functions already exist and are already tested (`calculateDailyRaids` in `daily-raids-calc.ts`, `computePlanInsights` in `plan-insights-calc.ts`, `buildMasterTable`/`filterMasterTableRows`/`sortMasterTable`, the Legendary Event `build*ViewModel` helpers); only the hooks that call them lack a memo boundary. Inputs reach those hooks from three sources with different stability: TanStack Query results (referentially stable while data is unchanged), Dexie `useLiveQuery` results (a fresh array per emission, stable between emissions) and local state. Until `catalog-read-layer` lands, the Dexie arrays are the only inputs that can still churn; they churn only on a sync, which is the moment a recompute is wanted anyway.

Constraints: no new dependencies; the FSD layout stays as is (moving files is `rehome-feature-logic`); query freshness and invalidation stay as they are (`tune-client-query-caching`); the max-lines rule applies to every touched file.

## Goals / Non-Goals

**Goals:**

- A keystroke in an HRE or HSE input, a sync progress tick, or a minute tick never re-runs a heavy pure function whose inputs are unchanged.
- Memoized child rows actually skip rendering when their props are unchanged (structural sharing from the hooks that feed them).
- Every hot path has a recorded Profiler number before and after, so the change is verified by measurement and not by inspection.

**Non-Goals:**

- Reducing the number of IndexedDB reads or stabilizing `useUnitName` (`catalog-read-layer`).
- Changing cache lifetimes, invalidation or request counts (`tune-client-query-caching`).
- Virtualizing lists, moving work to a Web Worker, or enabling the React compiler.
- Moving hooks between slices.

## Decisions

1. **`useMemo` around the existing pure functions, keyed on the resolved inputs, not a new cache helper.** The engine call in `useDailyRaids` moves into a `useMemo` whose dependencies are the query data objects, the live-query arrays, the settings values and the option fields. Alternative considered: a module-level memoized `calculateDailyRaids` keyed by argument identity, rejected because the hook already has all inputs in scope and a `useMemo` is the smallest diff. The `getCharacter`/`getUnitLabel`/`getTargetLabel` closures stay inside the memo and depend on `t` and the maps, which are stable between language changes.

2. **Objects passed into the engine are built once per change of their fields.** `HrePage` builds the raids `request` with `useMemo` over its primitive fields (`battlesToGo`, `eventOnly`, `slots`, `kind`, `alliance`, `enemyFaction`, labels); `HreRaidsSection` builds the `missionRaids` option the same way. Alternative: lifting `useHreProgress` out of the page, rejected because the raids request legitimately depends on mission progress; only the identity churn is the problem. The HSE projection inputs stay in the page for the same reason; `EventFarmSection` becomes `memo` so the page's input re-renders stop at its boundary, and the engine memo covers the rest.

3. **Goals overview metrics: one `useMemo` over the whole map; `useStableMap` deleted.** The hook computes the map inside `useMemo` keyed on the query data arrays (from `useQueries({ combine })`), the live-query arrays and the optional plan maps. With the inputs stable the output map is stable, so the deep-compare-and-`setState`-during-render helper has no remaining job and is removed, along with its second use in `goals-page.tsx` once `usePlanInsights` returns a stable `estimates` map (decision 4). Alternative: keep `useStableMap` as a safety net, rejected because it hides the next unstable input instead of surfacing it in the Profiler.

4. **`useQueries({ combine })` everywhere a hook maps over query results.** `combine` returns `{ data: [...], pending: Set, loaded: Set }` built from the results; TanStack structurally shares the combined value, so downstream `useMemo` dependencies hold. Applies to `use-goal-projects.ts`, the three `useQueries` calls in `use-goals-overview-metrics.ts` and the detail queries in `use-plan-insights.ts` and `use-daily-raids.ts`.

5. **Plan insights: memo instead of effect + hand-rolled `FetchState`.** The per-entity reads (`getPlayerCharacter`, `getPlayerMow`, `getInventoryShard` for each entity) become one `useLiveQuery` keyed on the sorted entity id list, mirroring `inventoryShardByEntity` in the overview-metrics hook; `computePlanInsights` then runs in a `useMemo` over its inputs. The `idSetKey` behavior (keep showing the previous result while only priorities change) is kept by returning the previous memo result through a ref until the new one is ready. The `JSON.stringify` key disappears; the inventory arrays themselves are dependencies. Alternative: Web Worker, deferred until the recorded baseline shows the memoized computation exceeding one frame on the reference account; the task list records the number either way.

6. **Minute clock as an external store with selectors.** `use-minute-now.ts` becomes a module-level ticker (`subscribe`, `getSnapshot`) consumed through `useSyncExternalStore`. `useLegendaryEvents`/`useLegendaryEvent` subscribe with a selector that returns the derived lifecycle signature, so their hosts (including `useNavItems` and the shell) re-render only when a lifecycle actually flips. Components that display a countdown subscribe to the raw instant through a small `useMinuteNow()` that keeps its current name and signature. Alternative: keep per-hook `setInterval` and memoize downstream, rejected because the host still re-renders every minute and the shell is a host.

7. **Legendary Event page view model in `useMemo`, handlers in `useCallback`.** The `viewModel` object and the `build*ViewModel` calls move under a `useMemo` keyed on their inputs; the inline closures passed to child sections become `useCallback`s so the memoized `TeamsSection`/leaderboard rows keep their props stable. No change to the view-model shape.

8. **Master table: memoized rows, debounced search commit.** `rows` moves under `useMemo` keyed on `table`, `state.q`, `state.sort`, `nameOf` and `i18n.language`. The search control keeps a local `useState` mirror of `state.q`, updates it on every keystroke and commits to the URL through the existing `update({ q }, true)` after a 200 ms timeout (cleared on unmount); the URL stays the source of truth on navigation and reload. The clear button writes immediately.

9. **Context splits and memoized values.** `PlayerDataContext` keeps `status`, `lastSyncedAt`, `error`, `requiresReauth`, `syncNow`; a new `PlayerDataProgressContext` carries `progress` alone and is read only by the component that shows the per-chunk progress. `HseLiveProvider` wraps its value in `useMemo`. `AppShell` wraps `launchCreateGoal` in `useCallback`. The shell `useNavItems` keeps its serialized-children memo but no longer re-renders per minute once decision 6 lands.

10. **Measurement is part of the change.** Each hot path gets a React Profiler recording (DevTools, "Record why each component rendered") on the reference account before and after, captured as commit count and max commit duration for one scripted interaction; the numbers go into the tasks notes. No automated performance test is added: the unit tests assert referential stability (same inputs, same output reference), which is the property the memo boundaries rely on.

## Risks / Trade-offs

- [A memo dependency list misses an input and a page shows stale data after a sync] -> each memo's dependency list is the full argument list of the pure function it wraps; a unit test per hook renders twice with one input changed and asserts the output changed; `react-hooks/exhaustive-deps` stays enabled and no new disables are added.
- [`useLiveQuery` arrays still churn on every sync and invalidate the memos] -> intended: a sync is the one moment a recompute is wanted. `catalog-read-layer` later replaces those arrays with query-cached maps and the same memos then hold across syncs with no further change here.
- [Debounced search commits the URL later than the keystroke] -> 200 ms is below the perceptible threshold for URL updates; the rows filter from local state immediately; tests that type and assert the URL use fake timers.
- [The external minute store shares one interval across the app] -> the interval starts on first subscriber and stops on last; tests use fake timers as they do today.
- [Removing `useStableMap` exposes an unstable input that the deep compare was masking] -> the Profiler baseline for the Goals page is recorded first; if row re-renders remain after the memo, the task is to fix the input, not to restore the helper.

## Migration Plan

Client-only, no flag. Land in three independently revertible PRs in this order: (1) daily-raids engine and HRE/HSE request memos, (2) Goals hooks (`combine`, overview memo, plan insights memo, `useStableMap` removal), (3) minute store, Legendary Event page, master table, context splits. Rollback is a revert of the affected PR.
