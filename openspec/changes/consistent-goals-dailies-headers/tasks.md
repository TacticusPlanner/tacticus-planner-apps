## 1. Shared Goals status filter

- [ ] 1.1 Create `StatusFilterSelect` in `pages/goals/ui/shared/` (Unfulfilled/Reached/Archived Select, default Unfulfilled, per-option counts, reached-indicator dot shown when reached count > 0 and value isn't "Reached").
- [ ] 1.2 Replace the `TabsList` in `goals-page.tsx` with `StatusFilterSelect`, wiring its existing `tabCounts`.
- [ ] 1.3 Replace the `TabsList` in `projects-page.tsx` with `StatusFilterSelect`, wiring its existing `counts`.
- [ ] 1.4 Add/update i18n keys under `goals.*` in `apps/web/public/locales/<locale>/common.json` for the select's labels and the reached-indicator's accessible text, for every supported locale.
- [ ] 1.5 Update or add unit tests covering: default selection, switching status, and indicator visibility (present/absent per the three scenarios in `specs/goals-navigation/spec.md`).

## 2. Shared Goals Type/Sort/Group filters

- [ ] 2.1 Extract the Type/Sort/Group filter row and its `goalType`/`sort`/`group` state and filtering logic out of `goals-page.tsx` into a shared `GoalFilters` component + hook in `pages/goals/ui/shared/`, preserving today's external behavior and mobile icon-only pattern exactly.
- [ ] 2.2 Update `goals-page.tsx` to consume the extracted `GoalFilters`.
- [ ] 2.3 Add `GoalFilters` to `projects-page.tsx`, scoped to the selected project's goals.
- [ ] 2.4 Regression-test Overview's filter/sort/group behavior post-extraction (existing behavior must be unchanged), then add equivalent tests for Projects.

## 3. Overview row consolidation

- [ ] 3.1 Move the Planning Settings button and its dialog-open state from `goals-layout.tsx` into `goals-page.tsx`; reduce `GoalsLayout` to `PageContainer` + `Outlet`.
- [ ] 3.2 On desktop, render `StatusFilterSelect`, `GoalFilters`, and the Planning Settings button in a single row on Overview.
- [ ] 3.3 On mobile, keep `StatusFilterSelect` in its own row; render `GoalFilters` and the Planning Settings button icon-only (extend the existing `isMobile ? null : <SelectValue />` pattern to the Planning Settings `Button`, keeping its `aria-label`).
- [ ] 3.4 Confirm Projects and Insights render no Planning Settings control at all.

## 4. Shared project selector

- [ ] 4.1 Add an icon-only/compact display mode to `ProjectSelect` (`entities/project/ui/project-select.tsx`) driven by `useIsMobile()`, preserving its accessible name below the 768px breakpoint.
- [ ] 4.2 Replace Insights' hand-rolled inline `<Select>` (`insights-page.tsx`) with `ProjectSelect`.
- [ ] 4.3 Verify every remaining Goals/Dailies project selector (Dailies, and the new Projects list from section 6) uses `ProjectSelect` directly, not a page-local reimplementation.
- [ ] 4.4 Update or add tests for `ProjectSelect`'s new compact mode, and for Insights' selector now showing the project color dot and default/active markers.

## 5. Dailies row consolidation

- [ ] 5.1 In `raids-layout.tsx`, render `RouteTabs` (leading) and `ProjectSelect` (trailing) in a single row instead of two stacked rows.
- [ ] 5.2 In `raids-plan-page.tsx`, move the Collapse/Expand button into the `plan-summary` section as a trailing element instead of its own row; render it icon-only on mobile with an accessible name for the current action.
- [ ] 5.3 In `raids-plan-page.tsx`, change the day-card grid's `grid-template-columns` from `repeat(auto-fit,minmax(20rem,1fr))` to a capped maximum (starting point: `repeat(auto-fit,minmax(20rem,24rem))`), and visually verify at 1, 2, 3, and 6+ visible days that cards no longer stretch to fill the row.
- [ ] 5.4 Update `dailies-navigation` and `daily-raids-plan` test coverage for the new row layout, the Collapse/Expand control's new position and mobile icon-only rendering, and the capped grid.

## 6. Projects: inline project management

- [ ] 6.1 Build a new inline project-list component in `features/project-management/ui/` (e.g. `project-management-list.tsx`) rendering every project as a row (color dot, name, status marker) with inline Edit/Set active/Archive/Restore actions per row, reusing `ProjectColorPicker` and `ProjectColorDot`.
- [ ] 6.2 Add the inline "New project" affordance at the end of the list, expanding the same inline create/edit form used by row-level Edit.
- [ ] 6.3 Wire the new component to `useProjectActions` (`create`/`save`/`activate`); remove the "Pause all"/"Resume all" UI entirely.
- [ ] 6.4 Grep for any remaining callers of `useProjectActions`'s `bulkStatus` after step 6.3; remove it from the hook too if nothing else calls it, otherwise leave it and note why in a code comment.
- [ ] 6.5 Update `projects-page.tsx`: render the new inline list above the goal list, remove `ProjectToolbar`, and drive `selectedProjectId` from row selection instead of a select's `onChange`.
- [ ] 6.6 Handle the "no projects yet" state: show only the inline "New project" affordance, no goal list or filters, per `specs/project-management/spec.md`.
- [ ] 6.7 Delete `project-toolbar.tsx`, `manage-projects-sheet.tsx`, and their test files (`project-toolbar.test.tsx`, `manage-projects-sheet.test.tsx`) once nothing imports them (already confirmed at proposal time: `projects-page.tsx` is `ProjectToolbar`'s only consumer, `ManageProjectsSheet`'s only caller is `ProjectToolbar` — re-check before deleting, since other work may have landed since).
- [ ] 6.8 Update `features/project-management/index.ts`'s public exports to match the new component, removing the retired ones.
- [ ] 6.9 Add/update i18n keys under `goals.project.*` in `common.json` for the new inline list/form copy, and remove now-unused Pause all/Resume all keys, for every supported locale.
- [ ] 6.10 Add tests for: listing projects inline, inline edit save, inline create, set active, archive/restore, row-click selecting the goal list's project, and the no-projects empty state.

## 7. Tutorials

- [ ] 7.1 Create `goals-page.tutorial.tsx` (desktop + mobile steps) for Overview, covering the consolidated status filter/GoalFilters/Planning Settings row, registered via `useTourPageSteps`. Overview currently has no tutorial.
- [ ] 7.2 Create a tutorial for the redesigned Projects page (desktop + mobile steps) covering the inline project list, inline edit/create, and the shared filters. Projects currently has no tutorial.
- [ ] 7.3 Update `today.tutorial.tsx` and `raids-plan.tutorial.tsx` for any `data-testid` selectors that moved (tab/selector row merge, Collapse/Expand button's new position).
- [ ] 7.4 Add/update `tour.<page>.steps.*` i18n keys in `common.json` for the new/changed tutorial steps, for every supported locale.

## 8. Verification

- [ ] 8.1 Manually verify Overview at ≥768px and <768px, with both a populated project and an empty (no-goals) state.
- [ ] 8.2 Manually verify Projects at ≥768px and <768px, with: no projects at all, one project, and multiple projects including an archived one.
- [ ] 8.3 Manually verify Insights' project selector renders identically (color dot, markers) to Dailies' and Projects' selectors.
- [ ] 8.4 Manually verify Dailies Today/Plan at ≥768px and <768px, including the Raids Plan grid at 1, 2, 3, and 6+ visible days, and the Collapse/Expand control in both states.
- [ ] 8.5 Run the FSD boundary validator (`pnpm lint:fsd`) after moving/retiring components across `pages/goals` and `features/project-management`.
- [ ] 8.6 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; fix any failures before considering the change done.
