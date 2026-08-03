## 1. Extract `features/goal-farming`, `entities/project`, and `features/project-management`

- [x] 1.1 Create `features/goal-farming/` slice with `index.ts` public API; move `estimate.ts`, `estimate.domain.ts`, `estimate-blocked.ts` from `pages/goals/model/estimate/` into it unchanged, updating their internal relative imports
- [x] 1.2 Move `goal-requirements.ts`, `progression-cost-calc.ts`, `farming-stages.ts`, `mow-ability-calc.ts`, `rank-additional-target.ts`, `level-xp-cost.ts`, `shard-energy-estimate.ts` (and their co-located `.test.ts` files) into `features/goal-farming/`, confirming each is actually part of the need-derivation graph (not Insights-only) before moving
- [x] 1.3 Move `rankResourceNeed`, `rankSlotsRemaining`, `abilityResourceNeed`, `resourceLabel` out of `pages/goals/model/insights/plan-insights-need.ts` into `features/goal-farming/lib/goal-need.ts` (renamed); update `plan-insights-calc.ts` and `goal-requirements.ts` to import from the new slice's public API
- [x] 1.4 Update `pages/goals/model/insights/plan-insights-calc.ts` and any other remaining `pages/goals` consumer to import `estimatePlan`, `estimateGoal`, `allocatePlanInventory`, `selectFarmNodes`, etc. from `features/goal-farming` instead of local relative paths
- [x] 1.5 Run the full existing test suite for the moved files unchanged (`estimate.test.ts` and siblings) to confirm the move introduced no behavior change
- [x] 1.6 Run Steiger (or repo's FSD lint) to confirm no forbidden cross-imports were introduced (`features/goal-farming` must not import `features/rank-lookup` or any other feature)
- [x] 1.7 Move `use-projects.ts` from `pages/goals/model/projects/` to `entities/project/model/`, adding a `defaultProjectId` derivation (`projects.find(p => p.isDefault)`) alongside the existing `activeProjectId`; update `pages/goals`' consumer to import it from `entities/project`
- [x] 1.8 Move `ProjectColorDot` from `pages/goals/ui/shared/project-color-dot.tsx` to `entities/project/ui/project-color-dot.tsx`; update its existing consumers' imports
- [x] 1.9 Move `projectMarkerSuffix` from `pages/goals/model/projects/project-marker.ts` to `entities/project/model/project-marker.ts`; update its existing consumers' imports
- [x] 1.10 Extract a plain `ProjectSelect` component (`entities/project/ui/project-select.tsx`: projects list, selected id, `onChange`, no manage/bulk-action affordances) out of `ProjectToolbar`'s inline `<Select>` block, reusing `ProjectColorDot`/`projectMarkerSuffix`; update `ProjectToolbar` to compose it instead of inlining its own `<Select>`
- [x] 1.11 Add `entities/project`'s public API exports (`useProjects`, `ProjectColorDot`, `ProjectSelect`, `projectMarkerSuffix`) to its `index.ts`
- [x] 1.12 Run the existing `ProjectToolbar`/`manage-projects-sheet` tests to confirm the extraction didn't change Goals-page behavior; run Steiger to confirm `entities/project` imports no `features/*` or `pages/*`
- [x] 1.13 Create `features/project-management/` slice; move `use-project-actions.ts` (+ its test) and `reorderedMemberIds`, `manage-projects-sheet.tsx` (+ its test), `project-color-picker.tsx`, and `project-toolbar.tsx` (+ its test) from `pages/goals` into it, updating internal relative imports (`ProjectToolbar` continues importing `entities/project`'s `ProjectSelect`)
- [x] 1.14 Update `pages/goals/ui/projects/projects-page.tsx` to import `ProjectToolbar`, `useProjectActions`, and `reorderedMemberIds` from `features/project-management` instead of local relative paths
- [x] 1.15 Add `features/project-management`'s public API (`index.ts`): export `ProjectToolbar`, `useProjectActions`, `reorderedMemberIds`
- [x] 1.16 Run the moved tests unchanged to confirm no behavior change; run Steiger — this slice currently has one consumer (`pages/goals`) by design (see design.md), so an `insignificant-slice` flag is expected and should be left in place or locally suppressed with a comment, not treated as a reason to fold the code back into `pages/goals`

## 2. Extend the engine with a day-1 breakdown

- [x] 2.1 Extend `spendDay`'s return type to include a per-node breakdown (resource id, battle id, raids performed, energy spent, and the node's daily attempt cap) alongside its existing `{energySpent, raidsPerformed}` aggregate; verify `estimateGoal`/`estimatePlan` behavior and return types are unchanged
- [x] 2.1a Also expose the day-spend function's shared `attemptsUsedByBattle` map (task 2.2/2.3) as part of the day-1 result (battle id → total raids across all goals that day), so "fully raided" can be derived from the node's combined daily total rather than any single breakdown entry's own count
- [x] 2.2 Fix `spendDay`'s `attemptsUsedByBattle` map to be an optional parameter shared across every goal's call within one simulated day, instead of a fresh map local to each call — a battle node's daily cap must be enforced across every goal that raids it that day, not reset per goal; `estimateGoal` continues defaulting to a fresh map per call since it has only one goal
- [x] 2.3 Factor `estimatePlan`'s per-day loop body (spend one combined day across all pending goals in priority order) into a standalone function usable both by `estimatePlan`'s repeat-until-resolved loop and a single-call "today" entry point; thread one shared `attemptsUsedByBattle` map (task 2.2) across every goal's call within that function's single day
- [x] 2.4 Add a new exported function (e.g. `estimateTodaySchedule`) that runs step 1 (priority-ordered inventory allocation) plus exactly one call of the day-spend function from 2.3, over a given set of in-scope `GoalNeed`s, and returns the structured day-1 breakdown grouped by resource, with each breakdown entry tagged with the `goalId` of the goal-turn that produced it
- [x] 2.5 Add tests: breakdown entries sum to the existing aggregate counts (invariant check), priority-ordered shared inventory still splits correctly when captured via the breakdown, per-battle daily-attempt caps are enforced across goals within the same day (not just within one goal's own turn), goal attribution is correct when two goals both raid the same upgrade, a node's combined-across-goals total correctly reaches its cap even when no single goal's entry does (task 2.1a)
- [x] 2.6 Add a Bonus Raids helper that calls the function from 2.4 twice (real `dailyEnergy`, then an unlimited sentinel value), diffs the two breakdowns (unlimited-run resource ids with zero raids in the real run), excludes any resource with at least one real-run raid, and sorts the result by goal priority; add tests covering the "partially raided is excluded" and "ordered by priority not by diff order" scenarios from the spec

## 3. Wire Today's data derivation

- [x] 3.1 Add a hook/model function that, given a selected project id, loads its goals via the existing `useProjectGoals` pattern, filters to `status: "Active"` only, and derives each in-scope goal's `GoalNeed` (including its priority) via `features/goal-farming` (mirroring how `plan-insights-calc.ts` currently derives needs, minus the Insights-only aggregation)
- [x] 3.2 Wire the derived `GoalNeed[]` + inventory + `planningSettings.dailyEnergy` into `estimateTodaySchedule` (task 2.4) to produce Today's schedule, and into the Bonus Raids helper (task 2.6) to produce Bonus Raids
- [x] 3.3 Handle the "no project available to default to" (project list failed to load or is empty) and "no farmable need" empty-state conditions from the spec at the data layer (distinct states, not just an empty array)
- [x] 3.4 Derive each contributing goal's unit and target label (character/MoW name plus its rank, ability, ascension, or upgrade target) alongside its `goalId`, for use as Today's per-goal group headers

## 4. Dailies navigation shell

- [x] 4.1 Replace the current `/dailies` placeholder page with a tabbed layout giving each primary tab its own route (`/dailies/raids`, `/dailies/shops`, `/dailies/onslaught`, `/dailies/salvage-run`, `/dailies/arena`, `/dailies/guild-raids`), reusing `/progress/route.tsx`'s nested-`RouteObject[]` + `<Outlet/>` + index-redirect pattern; `/dailies` redirects to `/dailies/raids`
- [x] 4.2 Wire Shops, Onslaught, Salvage Run, Arena, Guild Raids routes to the existing shared "Under Construction" placeholder component
- [x] 4.3 Add Raids' own 2 sub-tabs as their own routes (`/dailies/raids/today`, `/dailies/raids/plan`) using the same nested-route pattern; `/dailies/raids` redirects to `/dailies/raids/today`; wire `/dailies/raids/plan` to the Raids Plan page (task 8)
- [x] 4.4 Make both tab levels usable at desktop and mobile widths without changing their route or selection behavior; use horizontally scrollable tab lists where the labels do not fit

## 5. Today UI

- [x] 5.1 Add Today's project selector by composing `entities/project`'s `ProjectSelect` and `useProjects` (task 1.7/1.10), defaulting its initial selection to `activeProjectId ?? defaultProjectId`
- [x] 5.2 Add the raid schedule card list (one card per upgrade/shard: node(s), raid count each), grouped into per-goal sections separated and labeled with each goal's unit/target (task 3.4), consuming task 3.2's output; mark each node listing as fully raided when that node's combined daily total (task 2.1a) equals its daily cap (task 2.1), not the entry's own count alone
- [x] 5.3 Add the empty-state views: no project available to default to (project list failed to load or is empty), and project selected with nothing farmable
- [x] 5.4 Add the Bonus Raids section below a visible separator, grouped by goal the same way as 5.2 (in goal-priority order), including its own empty state, consuming task 2.6's output via task 3.2; initially render only the top 3 qualifying entries with a "Show more" control that reveals the rest in place when more than 3 qualify; mark node listings as fully raided the same way as 5.2
- [x] 5.5 Create the `dailies` i18next namespace (`public/locales/en/dailies.json`), move the existing `dailies.title`/`dailies.description` keys out of `common.json`, and add keys for all new UI copy (empty states, section headers, card labels, per-goal group header pattern, "Show more" control, fully-raided indicator label)
- [x] 5.6 Make Today's cards, goal groups, project selector, Bonus Raids, and empty states responsively reflow for mobile while preserving the same information and interactions as desktop
- [x] 5.7 Create and register a co-located Today Joyride tutorial via `useTourPageSteps`, covering the local Dailies/Raids navigation and Today content with desktop and mobile steps and stable `data-testid` targets, and add its `tour.today.steps.*` i18n keys to the `dailies` namespace in the same change

## 6. Extend the engine for the multi-day Raids Plan

- [x] 6.1 Extend `estimatePlan`'s day loop to collect each day's breakdown (task 2.1/2.4's per-node/per-goal structure, with the shared `attemptsUsedByBattle` totals from 2.1a) into an array, one entry per simulated day, alongside its existing per-goal `EstimateOutcome` map — additive, existing callers (Insights) unaffected
- [x] 6.2 Add a new exported function (e.g. `estimatePlanSchedule`) that runs the full day loop over a given set of in-scope `GoalNeed`s and returns the full per-day breakdown array plus the existing per-goal outcomes; `estimateTodaySchedule` (task 2.4) continues to only need index 0 internally (or is reimplemented as `estimatePlanSchedule(...).days[0]` if that's simpler without changing Today's own behavior)
- [x] 6.3 Add per-day and whole-plan summary aggregation: per day, sum that day's breakdown entries' `energySpent`/`raidsPerformed`; for the whole plan, sum across every day (including day 0/Day 1) for total energy and total raid-attempt count, count days where `dailyEnergy - dayEnergyTotal > 60` (ported threshold, task per design.md), and reuse the existing terminal `days`/`date` fields for total days and completion date
- [x] 6.4 Add tests: per-day breakdown entries sum to that day's totals, whole-plan totals sum correctly across all days including Day 1, the >60 "days unused" threshold is applied correctly (not "any leftover energy"), shared inventory carries forward correctly across days (a later day's need reflects earlier days' consumption), per-battle daily-attempt caps reset each day (not shared across days, only within a day per the 2.2 fix)

## 7. Wire Raids Plan's data derivation

- [x] 7.1 Reuse task 3.1's in-scope `GoalNeed[]` derivation (same project, same `Active`-only scope, same priority order) and task 3.4's per-goal unit/target labels for Raids Plan — no separate derivation logic
- [x] 7.2 Wire the derived `GoalNeed[]` + inventory + `planningSettings.dailyEnergy` into `estimatePlanSchedule` (task 6.2) to produce and hand the full per-day breakdown array, including Day 1, to the UI
- [x] 7.3 When everything resolves within Day 1, keep the Day 1 schedule as the complete one-day Plan rather than replacing it with a continuation empty state

## 8. Raids Plan UI

- [x] 8.1 Add the Raids Plan page composing Today's shared project selection (task 5.1's `entities/project` composition, same selected-project state lifted to the shared Raids parent so both sub-tabs read/write it)
- [x] 8.2 Add the whole-plan summary header: total days, total energy, total raid-attempt count, days-unused count, completion date (task 6.3's aggregates)
- [x] 8.3 Add the complete day-column list starting with Day 1 labeled "Today": each column shows its own energy-used/available and raid-attempt count (task 6.3), plus its per-goal-grouped raid list and fully-raided node indicators reusing Today's card/grouping components (tasks 5.2/3.4) rather than a separate implementation
- [x] 8.4 Add day pagination: render only the first 3 day columns initially with a "Show all days" control revealing the rest, mirroring Bonus Raids' truncation pattern (task 5.4)
- [x] 8.5 Add the card-density (collapse/expand) toggle applying uniformly to every visible day column's raid-list detail
- [x] 8.6 Preserve the Today column when everything resolves within Day 1 (task 7.3)
- [x] 8.7 Add Raids Plan's i18n keys to the `dailies` namespace (task 5.5): summary header labels, day-column labels, "Show all days", collapse/expand control, empty state
- [x] 8.8 Responsively compose Raids Plan's visible day cards for desktop and mobile while preserving the same first-3 truncation, "Show all days", and collapse/expand behavior
- [x] 8.9 Create and register a co-located Raids Plan Joyride tutorial via `useTourPageSteps`, covering the local Dailies/Raids navigation and plan content with desktop and mobile steps and stable `data-testid` targets, and add its `tour.raidsPlan.steps.*` i18n keys to the `dailies` namespace in the same change

## 9. Verification

- [x] 9.1 Add/extend tests for the Today data-derivation hook (task 3.1-3.3): Active-only filtering (Paused/Completed/Archived excluded), priority ordering preserved, empty-state conditions
- [x] 9.2 Add UI tests for the Dailies nav shell (default tab landing, placeholder rendering for each non-Today tab) and Today (schedule rendering, empty states, Bonus Raids rendering and ordering, per-goal grouping including the same-upgrade-under-two-goals case, Bonus Raids top-3 truncation and "Show more" reveal)
- [x] 9.3 Add UI tests for Raids Plan: Today-first rendering, per-day stats, whole-plan summary stats, pagination truncation/"Show all days", card-density toggle, the one-day Plan case, and that switching the shared project selector on Today updates Raids Plan too
- [x] 9.4 Manually verify in the running app: switching projects on Today recomputes both Today and Raids Plan correctly, a project with no goals shows the correct empty state on both, Bonus Raids ordering matches goal priority, and Raids Plan's day-by-day totals look sane against a known project
- [x] 9.5 Run the full `tacticus-planner-apps` test suite and typecheck to confirm the `features/goal-farming` extraction didn't regress the Goals/Insights page
- [x] 9.6 Add tutorial tests covering Dailies navigation, Today, and Raids Plan registration, desktop/mobile step selection, target availability, and localized step copy; manually run each tour at widths on both sides of the 768px breakpoint

## 10. Icon-led responsive refinement

- [x] 10.1 Extend the Dailies view model with goal-unit and resource visual metadata, resolving it through the existing shared unit/material icon components without changing schedule calculations
- [x] 10.2 Refine Today into compact mobile rows and an auto-filling desktop goal grid; add icon-led energy and raid-attempt stats while preserving accessible text and existing tutorial targets
- [x] 10.3 Refine Raids Plan into a compact responsive stat strip and auto-filling day grid, keeping each day schedule readable and reusing Today's icon language
- [x] 10.4 Update UI tests for visual metadata and responsive layout contracts, then run the Dailies tests, typecheck, lint, FSD validation, OpenSpec strict validation, and `git diff --check`
- [x] 10.5 Manually verify Today and Raids Plan with a populated project at one viewport below 768px and one viewport at or above 768px, including both Joyride tours
- [x] 10.6 Filter campaign-event battles before calculation so standing campaign locations remain available while event locations are eligible only when their campaign group matches the single `live-progress.activeCampaignEventId`; add focused derivation coverage for an active event and no active event
- [x] 10.7 Present every scheduled battle with the shared Character Lookup `LocationChips` visual language (campaign icon, localized short campaign/tier code, node number, and raid count) on both Today and Raids Plan, and test the shared presentation plus owned/target resource progress

## 11. Include Today in Raids Plan

- [x] 11.1 Pass the full engine day sequence to Raids Plan, label Day 1 as "Today", and retain it when the complete plan resolves on the first day
- [x] 11.2 Update Plan pagination and UI tests so the initial window is Today, Day 2, and Day 3, with later days revealed by "Show all days"
- [x] 11.3 Verify focused tests, typecheck, strict OpenSpec validation, and the populated Plan in the running app
