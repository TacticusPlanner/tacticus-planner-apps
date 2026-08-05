## 1. Projects page-slice scaffold

- [ ] 1.1 Create a new top-level `pages/projects` slice (route/index/ui) mirroring an existing top-level slice's structure (e.g. `pages/dailies`); move `projects-page.tsx` and its tests into it.
- [ ] 1.2 In `app/routes.tsx`, compose `pages/projects`' route element as the child of `GoalsLayout` (from `pages/goals`) at the existing `/goals/project` path, alongside Overview/Insights' routes from `pages/goals`.
- [ ] 1.3 Remove the Projects route from `pages/goals/route.tsx` now that `pages/projects` owns it.
- [ ] 1.4 Run `pnpm lint:fsd` to confirm this composition doesn't violate FSD boundaries; adjust if it does.

BLOCKED (see implementation notes / final report): empirically, `pnpm lint:fsd` (steiger's `fsd/forbidden-imports` rule) forbids `pages/projects` importing anything from `pages/goals`'s public API — same-layer page-to-page imports are disallowed even through `index.ts`. `ProjectsPage` currently depends on deep `pages/goals` internals (`GoalsList`, `GoalDetailSheet`, and ~20-30 supporting model/hook files for attainment, estimates, blockers, insights). Moving it out would require first extracting all of that shared infrastructure into a new `widgets/` layer — a large, high-risk refactor of business-critical calculation code not scoped in proposal.md/design.md's Impact list. Deferred pending a human decision (extract to `widgets/goal-board` vs. revert Decision 6 and keep Projects inside `pages/goals`); all of sections 2-7 below were implemented with `ProjectsPage` remaining at its current location (`pages/goals/ui/projects/projects-page.tsx`) so the rest of the change could proceed.

## 2. Shared Goals status filter and Type/Sort/Group filters

- [x] 2.1 Create `StatusFilterSelect` in `entities/goal/ui/` (Unfulfilled/Reached/Archived Select, default Unfulfilled, per-option counts, reached-indicator dot shown when reached count > 0 and value isn't "Reached").
- [x] 2.2 Extract the Type/Sort/Group filter row and its `goalType`/`sort`/`group` state and filtering logic out of `goals-page.tsx` into `GoalFilters` in `entities/goal/ui/`, preserving today's external behavior and mobile icon-only pattern exactly.
- [x] 2.3 Update `goals-page.tsx` (Overview) to consume both `StatusFilterSelect` and `GoalFilters` from `entities/goal/ui` instead of its local `TabsList`/filter row.
- [x] 2.4 Update the Projects page to consume `StatusFilterSelect` from `entities/goal/ui`, wired to its own `counts` (Projects page not yet physically moved — see Section 1 blocker note). Projects does not consume `GoalFilters` — Type/Sort/Group stays out of scope for Projects.
- [x] 2.5 Add/update i18n keys under `goals.*` in `apps/web/public/locales/<locale>/common.json` for the select's labels and the reached-indicator's accessible text, for every supported locale.
- [x] 2.6 Regression-test Overview's filter/sort/group behavior post-extraction (existing behavior must be unchanged); add tests for `StatusFilterSelect`'s default selection, status switching, and indicator visibility (present/absent per `specs/goals-navigation/spec.md`) on both Overview and Projects.

## 3. Overview row consolidation

- [ ] 3.1 Move the Planning Settings button and its dialog-open state from `goals-layout.tsx` into `goals-page.tsx`; reduce `GoalsLayout` to `PageContainer` + `Outlet`.
- [ ] 3.2 On desktop, render `StatusFilterSelect`, `GoalFilters`, and the Planning Settings button in a single row on Overview.
- [ ] 3.3 On mobile, keep `StatusFilterSelect` in its own row; render `GoalFilters` and the Planning Settings button icon-only (extend the existing `isMobile ? null : <SelectValue />` pattern to the Planning Settings `Button`, keeping its `aria-label`).
- [ ] 3.4 Confirm Projects and Insights render no Planning Settings control at all.

## 4. Shared project selector

- [ ] 4.1 Add an icon-only/compact display mode to `ProjectSelect` (`entities/project/ui/project-select.tsx`) driven by `useIsMobile()`, preserving its accessible name below the 768px breakpoint.
- [ ] 4.2 Replace Insights' hand-rolled inline `<Select>` (`insights-page.tsx`) with `ProjectSelect`.
- [ ] 4.3 Verify every remaining Goals/Dailies project selector (Dailies, and the new Projects page from section 6) uses `ProjectSelect` directly, not a page-local reimplementation.
- [ ] 4.4 Update or add tests for `ProjectSelect`'s new compact mode, and for Insights' selector now showing the project color dot and default/active markers.

## 5. Dailies row consolidation

- [ ] 5.1 In `raids-layout.tsx`, render `RouteTabs` (leading) and `ProjectSelect` (trailing) in a single row instead of two stacked rows.
- [ ] 5.2 In `raids-plan-page.tsx`, move the Collapse/Expand button and the "Show all days" button into the `plan-summary` section as trailing elements, instead of each occupying its own row below the day-card grid; render Collapse/Expand icon-only on mobile (accessible name for the current action), keep "Show all days" as text on every breakpoint.
- [ ] 5.3 In `raids-plan-page.tsx`, change the day-card grid's `grid-template-columns` from `repeat(auto-fit,minmax(20rem,1fr))` to a capped maximum (starting point: `repeat(auto-fit,minmax(20rem,24rem))`), and visually verify at 1, 2, 3, and 6+ visible days that cards no longer stretch to fill the row.
- [ ] 5.4 Update `dailies-navigation` and `daily-raids-plan` test coverage for the new row layout, the Collapse/Expand and "Show all days" controls' new shared position and mobile icon-only rendering (Collapse/Expand only), and the capped grid.

## 6. Projects: on-page project list, narrowed form Sheet, and a dedicated goal-list selector

- [ ] 6.1 Build a new on-page project-list component (in the new `pages/projects` slice, or a `features/project-management` component it composes) rendering every project — including archived — as a row (color dot, name, status marker) with row actions: Edit, Set active, Archive, Restore, reusing `ProjectColorDot`.
- [ ] 6.2 Narrow `ManageProjectsSheet` to a create/edit-only form (name/description/color, reusing `ProjectColorPicker`): remove its embedded project list and selection state, keep its existing `save`/`status` mapping (Archive → `"Archived"`, Restore → `"Active"`) and its existing Archive guard (`disabled` while pending, or for the default/active project).
- [ ] 6.3 Wire "New project" and each row's "Edit" action to open the narrowed Sheet — blank for New, pre-filled with that row's project for Edit.
- [ ] 6.4 Add a `ProjectSelect` immediately after the project list, paired in the same row as `StatusFilterSelect` above the goal list (per the goals-navigation project-selector-position rule); it alone drives which project's goals the list below shows — confirm no row action changes this selection.
- [ ] 6.5 Remove `ProjectToolbar` and its "Pause all"/"Resume all" UI entirely.
- [ ] 6.6 Grep for any remaining callers of `useProjectActions`'s `bulkStatus` after 6.5; remove it from the hook too if nothing else calls it, otherwise leave it and note why in a code comment.
- [ ] 6.7 Handle the "no projects yet" state: show only the "New project" affordance, no `ProjectSelect` or goal list, per `specs/project-management/spec.md`.
- [ ] 6.8 Delete `project-toolbar.tsx` and its test once nothing imports it (confirmed at proposal time: the Projects page and its own test are its only consumers — re-check before deleting).
- [ ] 6.9 Split `manage-projects-sheet.test.tsx`'s existing coverage: list/selection-related tests move to the new project-list component's tests; form-submission/validation/Archive-guard tests stay with the narrowed Sheet.
- [ ] 6.10 Update `features/project-management/index.ts`'s public exports to match the narrowed Sheet and new list component, removing `ProjectToolbar`'s export.
- [ ] 6.11 Add/update i18n keys under `goals.project.*` in `common.json` for the new list/narrowed-form copy, and remove now-unused Pause all/Resume all keys, for every supported locale.
- [ ] 6.12 Add tests for: listing all projects including archived, New/Edit opening the Sheet correctly (blank vs. pre-filled), Set active/Archive/Restore, the Archive guard's disabled conditions, `ProjectSelect` scoping the goal list independently of row actions (acting on a different project's row doesn't change the selected goal list), and the no-projects empty state.

## 7. Tutorials

- [ ] 7.1 Create `goals-page.tutorial.tsx` (desktop + mobile steps) for Overview, covering the consolidated status filter/GoalFilters/Planning Settings row, registered via `useTourPageSteps`. Overview currently has no tutorial.
- [ ] 7.2 Create a tutorial (desktop + mobile steps), co-located in the new `pages/projects` slice, covering the on-page project list, the narrowed create/edit Sheet, and the dedicated goal-list `ProjectSelect`. Projects currently has no tutorial.
- [ ] 7.3 Update `today.tutorial.tsx` and `raids-plan.tutorial.tsx` for any `data-testid` selectors that moved (tab/selector row merge, Collapse/Expand and "Show all days" controls' new position).
- [ ] 7.4 Add/update `tour.<page>.steps.*` i18n keys in `common.json` for the new/changed tutorial steps, for every supported locale.

## 8. Verification

- [ ] 8.1 Manually verify Overview at ≥768px and <768px, with both a populated project and an empty (no-goals) state.
- [ ] 8.2 Manually verify Projects at ≥768px and <768px, with: no projects at all, one project, and multiple projects including an archived one; confirm the URL is still `/goals/project` and the Overview/Projects/Insights tab bar still works correctly after the page-slice move.
- [ ] 8.3 Manually verify Insights' project selector renders identically (color dot, markers) to Dailies' and Projects' selectors.
- [ ] 8.4 Manually verify Dailies Today/Plan at ≥768px and <768px, including the Raids Plan grid at 1, 2, 3, and 6+ visible days, and the Collapse/Expand and "Show all days" controls together in the summary area.
- [ ] 8.5 Run the FSD boundary validator (`pnpm lint:fsd`) after introducing `pages/projects`, `entities/goal/ui`, and retiring/narrowing the `features/project-management` components.
- [ ] 8.6 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; fix any failures before considering the change done.
