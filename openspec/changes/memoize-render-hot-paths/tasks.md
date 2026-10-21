# Tasks

Profiler baseline procedure (used by every "baseline" task): run the full local stack through the workspace Aspire AppHost, sign in with the reference account, open React DevTools Profiler with "Record why each component rendered" on, perform the named interaction once, and record commit count and max commit duration (ms) in this file under the task as `before: N commits / X ms` and `after: N commits / X ms`.

## 1. Daily-raids engine (Dailies, HRE, HSE, Home)

- [ ] 1.1 Record the baseline for: typing one digit in the HRE mission tracker on `/dailies/hre`, typing one digit in the HSE projection inputs on `/dailies/hse`, and opening `/dailies` Today; note which components committed and why.
- [ ] 1.2 Wrap the `calculateDailyRaids` call and the `planMission` builder in `features/daily-raids/model/use-daily-raids.ts` in `useMemo` keyed on the resolved query data, live-query arrays, settings values and option fields; convert its detail `useQueries` to `combine`; verify `use-daily-raids.test.tsx` passes and a new test asserts that re-rendering the hook with identical inputs returns the same result reference while a changed input returns a new one.
- [ ] 1.3 Build the HRE raids `request` in `pages/dailies/ui/hre-page.tsx` with `useMemo` over its primitive fields and the `missionRaids` option in `features/daily-raids/ui/hre-missions/hre-raids-section.tsx` the same way; verify `hre-page.test.tsx` passes and a test asserts the engine is not re-invoked when only `points`/`rank`/`target` change.
- [ ] 1.4 Wrap `EventFarmSection` in `memo`; verify `hse-page.test.tsx` passes and a test asserts that updating a projection input does not re-render `EventFarmSection`.
- [ ] 1.5 Re-record the three interactions from 1.1 and confirm the engine does not run on a keystroke (no `useDailyRaids` host in the committed set) and the Today mount commit count did not grow.

## 2. Goals hooks

- [ ] 2.1 Record the baseline for: toggling one goal's status on `/plan/goals` with the reference account, and switching the goal-type tab; note how many `GoalTableRow` instances committed.
- [ ] 2.2 After `rebuild-foundation-pre-launch` has landed (it deletes `use-goal-projects.ts` and `use-stable-map.ts`, removes every `useQueries` fan-out from `use-goals-overview-metrics.ts` / `use-plan-insights.ts` / `use-goal-attainment.ts`, and wraps their computations in one `useMemo` over the list-derived inputs): re-record the two interactions from 2.1 and confirm only the toggled row (plus its parents) committed on a status toggle. If a goals hook still recomputes on an unrelated re-render, add the missing memo in that hook here and a test asserting referential stability. Verify: profiler recording shows the expected commit set.

Former 2.2–2.5 (`useQueries({ combine })` on `use-goal-projects`, `combine` on the overview metrics fan-outs, the `FetchState` replacement in `use-plan-insights`, deleting `use-stable-map`) are struck: `rebuild-foundation-pre-launch` removes those fan-outs and files outright, so memoizing them first would be wasted work.

## 3. Minute clock and Legendary Events

- [ ] 3.1 Record the baseline for: leaving `/legendary-events/<active event id>` open across one minute boundary, and leaving `/home` open across one minute boundary; note the committed components.
- [ ] 3.2 Rewrite `entities/legendary-event/model/use-minute-now.ts` as a module-level ticker exposed through `useSyncExternalStore` with a selector argument; keep `useMinuteNow()` returning the raw instant; have `use-legendary-events.ts` and `use-legendary-event.ts` subscribe through a selector that returns the lifecycle signature so unchanged lifecycles cause no render; verify a new test with fake timers asserts a host re-renders on a lifecycle flip and not on a plain tick, and the existing `use-nav-items.test.tsx` passes.
- [ ] 3.3 Move the `viewModel` construction and `build*ViewModel` calls in `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx` under `useMemo`, and the inline handlers passed to child sections under `useCallback`; verify the page tests pass and the file stays under the max-lines limit (extract a `useLegendaryEventPageViewModel` hook next to the existing `.view-model.ts` only if needed).
- [ ] 3.4 Memoize `rows` in `pages/legendary-events/ui/master-table/master-table-page.tsx` and add the local search state with a 200 ms debounced `update({ q }, true)` commit (immediate on clear); verify `master-table-page.test.tsx` passes with fake timers and a test asserts the URL carries `q` after the debounce and the rows filter before it.
- [ ] 3.5 Re-record the two interactions from 3.1 and confirm that a minute tick without a lifecycle change commits only countdown components.

## 4. Shell contexts

- [ ] 4.1 Record the baseline for: a manual player-data sync from the mobile layout (viewport below 768 px) on `/home`; note whether the sidebar/nav committed per progress tick.
- [ ] 4.2 Split `PlayerDataContext` in `shared/player-data-status/player-data-status.ts` into a status context and a `PlayerDataProgressContext`, provide both from `app/providers/player-data-provider.tsx`, and read progress only where it is displayed; verify `player-data-provider.test.tsx` passes and a test asserts a status-only consumer does not re-render on a progress update.
- [ ] 4.3 Memoize the `HseLiveProvider` context value in `app/layout/hse-live-provider.tsx` and wrap `launchCreateGoal` in `useCallback` in `app/layout/app-shell.tsx`; verify the app-shell tests pass and a test asserts `NavLiveDot` does not re-render when the provider re-renders with unchanged signals.
- [ ] 4.4 Re-record the interaction from 4.1 and confirm the nav does not commit per progress tick.

## 5. Integration

- [ ] 5.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`; all pass with no new `eslint-disable` for `react-hooks/exhaustive-deps`.
- [ ] 5.2 Desktop verification (viewport at or above 768 px): on `/dailies/hre`, `/dailies/hse`, `/plan/goals`, `/legendary-events/<active id>` and `/legendary-events/master-table`, confirm the rendered data matches the pre-change build for the reference account (same rows, totals, countdowns) and typing in the master-table search filters immediately and updates the URL; requires an account with at least one active goal and a running HRE or HSE.
- [ ] 5.3 Mobile verification (viewport below 768 px, via a same-origin iframe on the app origin per the `tp-manual-ui-verification` skill): repeat 5.2 on the mobile layout and confirm the sync status pill still updates during a manual sync.
- [ ] 5.4 Paste the before/after numbers from 1.1/1.5, 2.1/2.6, 3.1/3.5 and 4.1/4.4 into this file; every "after" commit count for a keystroke, progress tick or plain minute tick excludes the heavy hook hosts.

## Workflow follow-up

- Archive the change after review; no spec sync is needed (`skip_specs: true`).
