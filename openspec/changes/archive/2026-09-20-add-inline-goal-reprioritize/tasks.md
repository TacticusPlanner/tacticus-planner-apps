## 1. Shared drag-reorder component

- [x] 1.1 Extract or port a generic `SortableList`-style component (item-agnostic drag reorder via `@dnd-kit/core`/`sortable`, modeled on `tacticusplanner`'s `sortable-list.tsx`) into an appropriate FSD slice shared by both the desktop row list and the mobile card list — verify with a component test covering reorder-by-drag and reorder-by-keyboard. Built `pages/goals/ui/shared/sortable-list.tsx`; applies `ref`/`style` directly onto each item's own root element (no wrapping div) so it works for both `<TableRow>` and `<li>`. Reorder-by-drag verified live against the real API (see 9.2); reorder-by-keyboard relies on dnd-kit's own `KeyboardSensor`, exercised via focus/activation in `project-detail-page.test.tsx`.
- [x] 1.2 Remove `reprioritize-units-sheet.tsx` and its trigger from `project-detail-page.tsx`, and delete its now-unused tests. Also deleted `project-unit-plans.ts`/`.test.ts` (the dialog's only consumer — `projectUnitPlans`, `reorderProjectUnits`, `dependencyFirst`) once nothing referenced it.

## 2. API client

- [x] 2.1 Update `entities/project/api/project.api.ts` and `features/project-management/model/use-project-actions.ts` to call the companion api change's new goal-keyed reorder endpoint instead of the removed unit-order one, updating `project.api.test.ts` accordingly. `updateProjectUnitOrder` → `updateProjectGoalOrder`; `reorderUnits` → `reorderGoals`; `ProjectUnitKey` type removed (no remaining callers).
- [x] 2.2 Update `add-goals-to-project-sheet.tsx`'s `updateProjectGoals` call to stop computing/sending `priority` per goal, since the companion api change makes `UpdateProjectGoalsEndpoint` ignore that field — verify by updating `add-goals-to-project-sheet.test.tsx`'s request-shape assertions. `ProjectGoalEntry.priority` made optional (still present on responses); `add-goals-to-project-sheet.tsx` no longer computes `maxPriority`/sends `priority` on additions.

## 3. Desktop: inline per-goal drag

- [x] 3.1 Add a `reorderable` (or equivalent) prop to the shared goal-row component, **reusing/renaming the existing but inert `reorderEnabled`/`onMove` props already declared on `GoalsListProps`** — so a leading drag handle renders only on project detail, not Goals Overview. Kept `reorderEnabled` (same name, now live), renamed `onMove` → `onReorder` (new drag-fit signature) rather than adding a parallel prop; stale "Phase 3 scope notes" doc comment replaced. A drag handle renders only for in-flight (Active/Paused) rows — a historical row visible in the same sorted list gets no handle (see `isInFlightStatus`), verified by test.
- [x] 3.2 Wire the drag handle to the shared `SortableList` component (1.1) and the new reorder API call (2.1), with optimistic reordering on drop, the drag surface disabled while a reorder mutation is in flight, and rollback to server state on a rejected (stale-set) response. `spliceGoalOrder` (goal-order.ts) anchors a drop against the nearest _visible_ neighbor that's actually in the full in-flight list (skipping historical neighbors); `reorderPending` (from `projectActions.pending`) disables the drag surface for the simpler race fix design.md settled on (disable-while-pending, not a queue). Verified live against the real API (200 OK round-trips, see 9.2).
- [x] 3.3 Verify (test) that dragging a goal ahead of an unreached `DependsOn` prerequisite succeeds and that goal's Restricted indicator is unaffected — covered in `project-detail-page.test.tsx` (no client-side validation exists to block it; the API side has its own equivalent test).

## 4. Mobile: reorder mode

- [x] 4.1 Add reorder-mode toggle state to the mobile goal list on project detail, with a button to enter/exit it. `mobileReorderActive` state + `[data-testid="project-mobile-reorder-toggle"]` button, shown only on mobile with ≥2 in-flight goals.
- [x] 4.2 Render collapsed, minimal-info cards (unit name/avatar, goal from → to) when reorder mode is active, each directly draggable via the shared component (1.1), committing each drag immediately (no Save step). Only in-flight rows are shown in this mode (historical rows have nothing to reorder).
- [x] 4.3 Verify exiting reorder mode restores full card presentation, with a test.

## 5. Group=Unit stays display-only (verification, not new grouping code)

- [x] 5.1 Confirm `groupRows` needs no changes: it already clusters "already-sorted rows" by unit key in first-appearance order with incoming row order preserved — verified directly by reading `row-groups.ts`; design.md corrected (it had incorrectly assumed new grouping code was needed). `projectUnitPlans` itself was deleted (2.1/1.2), not kept — it existed only for the removed dialog, not for clustering.
- [x] 5.2 Verify the existing Sort-orders-clusters behavior still holds under flat-per-goal priority — covered by `project-detail-page.test.tsx`'s existing Sort/Group tests, updated for the new flat semantics (no `dependencyFirst` re-derivation).
- [x] 5.3 Confine drag-and-drop to a goal's own cluster while Group=Unit is active — this falls out of the existing architecture for free: `ProjectDetailGoals` instantiates one `<GoalsList>` (one `SortableList`/`DndContext`) _per row-group_, so there is structurally no cross-cluster drop target. No new code needed; noted in design.md.

## 6. Level-goal row merge

- [x] 6.1 Add a derivation (pure function, unit-tested) over the loaded goal list: for each Level goal, find goals whose `DependsOn` includes it; return "merge into that goal" only when exactly one such dependent exists, otherwise "render standalone". `model/shared/level-goal-merge.ts` (`computeLevelMerges`, `excludeMergedLevelGoals`, `levelGoalIdByParent`) + `level-goal-merge.test.ts`, covering zero/one/multiple-dependent cases.
- [x] 6.2 Wire the desktop table and mobile card rendering to skip a Level goal's own row/card when merged, and render its existing progress bar/percent/remaining-text as a sub-line under its dependent's row/card. Computed once per page (`useLevelGoalMerges`, over the flat ungrouped set — grouping by type would otherwise separate a Level goal from its dependent) in both `project-detail-page.tsx` and `goals-page.tsx` (Goals Overview also merges, per the spec), threaded through `ProjectDetailGoals`/`GoalsList` as `levelGoalIdByParent`. Rendered via a new shared `LevelGoalSubLine` component (`goal-row-shared.tsx`) reusing `GoalTargetDisplay`/`GoalProgressDisplay` unchanged. Verified live against real data (see 9.2) — merged sub-lines render correctly on real Rank goals with a dependent Level goal.
- [x] 6.3 Verify a merged Level goal's own actions remain reachable from its detail view, opened from the sub-line. `LevelGoalSubLine` opens the Level goal's own detail sheet on click; verified live (see 9.2) — opening a sub-line shows the Level goal's own status/progress/dependencies/history, independent of its parent.

## 7. Onboarding tour

- [x] 7.1 Update `project-detail-page.tutorial.tsx`'s reprioritize step to target the new drag handle (desktop) and the mobile reorder-mode button (mobile), replacing the removed `[data-testid="project-reprioritize-units"]` target. Desktop/mobile step arrays now diverge only on this one step's target.
- [x] 7.2 Add/update the corresponding `tour.projectDetail.steps.*` i18n keys for the retargeted step across every supported locale (en, de, es, fr) with real translations.

## 8. i18n

- [x] 8.1 Add i18n keys for all new UI copy (mobile reorder-mode button label, drag handle accessible label) in the `goals` namespace (`apps/web/public/locales/*/common.json`), with real de/es/fr translations; the now-dead `reprioritizeUnits`/`dragUnit`/`reprioritizeStaleError`/`reprioritizeSaveError` keys were removed rather than left orphaned.

## 9. Regression and boundary checks

- [x] 9.1 Run the FSD boundary validator after moving the shared drag component and any relocated logic — `steiger ./src/fsd`: no problems found.
- [x] 9.2 Manual verification: the Aspire stack was already running with a signed-in browser session, so this ran live rather than being deferred. Verified on `http://localhost:5173/goals/projects/{id}` (desktop viewport): drag handles render on every in-flight row and only those; two real drags each produced a `PUT .../goal-order` request returning `200`, followed by automatic refetch; the Level-goal merge renders correctly on real Rank goals with a dependent Level goal (e.g. Ahriman "Lv 44 → 50" sub-line), and clicking a merged sub-line opens the Level goal's own detail sheet with its own status/progress/history. Mobile-viewport resize via the browser tool did not visually apply in this session (tooling limitation, not a code issue) — the mobile-specific rendering path (collapsed cards, reorder-mode toggle) is covered by the unit/component test suite instead.

## 10. Repository gates

- [x] 10.1 `pnpm test:run` — 233 files, 1811 tests passed.
- [x] 10.2 `pnpm typecheck` — clean.
- [x] 10.3 `pnpm lint` (eslint + knip) — clean.
- [x] 10.4 `pnpm lint:fsd` — clean.
- [x] 10.5 `git diff --check` — clean (only benign CRLF-conversion notices).
