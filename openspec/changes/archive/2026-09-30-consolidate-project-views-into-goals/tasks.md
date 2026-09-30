## 1. Project scope state and chip row

- [x] 1.1 Add `useGoalsProjectScope(projects)` in `pages/goals/model/projects/` reading/writing the `project` search param with replace semantics and the validation table from design D1; unit-test scoped, unknown (param dropped), archived (param dropped), and loading/error (param kept, unscoped) cases.
- [x] 1.2 Replace `overview-project-quicknav.tsx` with `goals-project-scope.tsx`: "All goals" + Default-first non-archived chips with color, name, and non-archived goal counts, one `aria-pressed` selection, horizontal scroll, skeleton/failure/empty states per `goals-navigation` "Goals project scope chip row"; delete the mobile `useHomeProjects` branch. Verify with a component test covering order, counts, selection, loading, failure, and no-projects.
- [x] 1.3 Wire the chip row into `goals-page.tsx` as the row above the controls at both breakpoints, delete `goals-project-filter.tsx`, `ALL_PROJECTS`, `GoalsCreateProjectSheet` usage and the `createProjectOpen` state; verify `goals-page` tests pass with the membership select gone and scoping driven by the chip row.
- [x] 1.4 Add a `goals-page` test that switches scope and asserts the status filter, type filter, and group are unchanged and that the status counts follow the scope.

## 2. Goals control row, copy, and prefill

- [x] 2.1 Replace the `goals-order-note` paragraph with an `InfoHint` in the control row whose content is the unscoped note plus the account-wide-gap sentence when scoped; test both contents and that it renders only when reordering is available and rows exist.
- [x] 2.2 Make Goals' contextual Create goal button pass `{ projectIds: [projectId] }` while scoped and nothing while unscoped; test both launches.
- [x] 2.3 Update `app-shell.tsx`'s global `onCreateGoal` to read `?project=` on `/plan/goals` instead of matching `/plan/projects/:projectId`; update its test to cover scoped Goals, unscoped Goals, and a non-Goals route.
- [x] 2.4 Add the empty-project branch (`goals-page-empty-project`) with reworded `goals.project.emptyProjectDescription`, keep the generic filtered-empty branch for filter-caused emptiness; test both.

## 3. Projects page actions and navigation targets

- [x] 3.1 Extend `features/project-management/ui/project-row.tsx` with optional `onCreateGoal`/`onManageGoals` and render Create goal, Manage goals, Edit, Archive (non-archived rows) or Edit, Restore (archived rows) in that order; update `project-row.test.tsx` for both menus and for no Pause all / Resume all items.
- [x] 3.2 In `projects-list-page.tsx`, host one `AddGoalsToProjectSheet` keyed by the chosen row's project, pass `launchCreateGoal({ projectIds: [id] })` for Create goal, and navigate row activation to `/plan/goals?project={id}`; test that Manage goals opens for the clicked row's project without changing the URL and that row activation navigates to the scoped Goals URL.
- [x] 3.3 Change `pages/home/ui/projects/projects-widget.tsx` card navigation to `/plan/goals?project={id}` and update its test.
- [x] 3.4 Remove `setGoalsStatus` from `useProjectActions`, the API client method it called (if unreferenced afterwards), and their tests; verify `pnpm typecheck` finds no remaining callers.

## 4. Routes and navigation metadata

- [x] 4.1 Remove the `projects/:projectId` route and `ProjectDetailPage` import from `pages/goals/route.tsx`; update `route.test.tsx` so `/plan/projects/{id}` is asserted to hit the app's not-found handling.
- [x] 4.2 Delete `app/legacy-goals-path.ts` (+ test), the `LegacyGoalsRedirect` component and `/goals/*` route in `app/routes.tsx`, and the `mapLegacyGoalsPath` call in `app/resolve-next-path.ts` (+ its legacy test cases); verify `pnpm typecheck` and the remaining `resolve-next-path` tests pass.
- [x] 4.3 Remove `isLandingPage` from the Projects nav item in `nav-items.ts` and adjust `section-tabs.test.tsx`; verify the Library raid-boss landing behavior test still passes.

## 5. Delete the project detail route

- [x] 5.1 Delete `project-detail-page.tsx`, `project-detail-header.tsx`, `project-detail-goals.tsx`, `project-detail-page.tutorial.tsx`, their tests, and `model/projects/use-project-goal-reorder.ts` (+ test); verify `pnpm typecheck` and `pnpm lint:fsd` pass with no dangling imports.
- [x] 5.2 Remove the `goals.projectDetail.group` persistence read and its "unit"→"type" clamp along with the page; verify no reference to that key remains (`rg goals.projectDetail`).
- [x] 5.3 Remove now-unused i18n keys in all four locales: `goals.project.projectSwitcherLabel`, `statusFilterFieldLabel`, `groupByFieldLabel`, `backToProjects`, `notFoundTitle`, `notFoundDescription`, `pauseAllGoals`, `resumeAllGoals`, `unitGoalSummaryOfAccount`, `projectGuidanceTitle/Preview/Summary_*/None`, `quicknavLabel`, `quicknavAllProjects`, `goals.order.projectNote`/`openPlan` if superseded by 2.1, and `tour.projectDetail.*`; verify with the existing translation-key consistency tests and `rg` for each key.

## 6. Tutorials and i18n

- [x] 6.1 Update `goals-page.tutorial.tsx`: replace the quick-nav step with a project-scope step targeting `goals-project-scope` (desktop and mobile), and the order-note step with the info affordance; add/update `tour.goalsOverview.steps.*` keys in en/de/es/fr with real translations; verify the tutorial test enumerates the new steps.
- [x] 6.2 Update `projects-list-page.tutorial.tsx`'s row-actions step copy to name Create goal and Manage goals; update `tour.projectsList.steps.*` in en/de/es/fr; verify its test.
- [x] 6.3 Add the new UI copy (chip row aria-label, "All goals" chip, scoped order-hint sentence, reworded empty-project description) to `common.json` in en/de/es/fr with real de/es/fr translations; verify the translation-key tests pass.

## 7. Desktop verification (viewport ≥ 768px, Aspire stack, signed-in account with ≥ 2 projects incl. one empty project and one archived project)

- [x] 7.1 `/plan/goals`: chip row shows All goals, Default first, other non-archived projects with counts, archived absent; control row directly beneath with no project select; order info affordance opens on click and on focus.
- [x] 7.2 Select a project chip: URL becomes `?project={id}` (Back leaves the page), list narrows, status counts follow the scope, status/type/group unchanged; reload keeps the scope; select All goals restores.
- [x] 7.3 Scoped Create goal (contextual button and Ctrl/Cmd+G) preselects the project; unscoped opens with no prefill.
- [x] 7.4 Empty project chip shows the empty-project copy; a filter-empty scope shows the generic copy.
- [x] 7.5 `/plan/projects`: row menu shows Create goal, Manage goals, Edit, Archive; Manage goals opens for that row; archived row shows Edit, Restore; row click opens scoped Goals; Home Your Projects card opens scoped Goals.
- [x] 7.6 `/plan/projects/{id}` and `/goals/projects/{id}` land on the not-found handling; `/plan/goals?project=<unknown>` lands on unscoped Goals with the param dropped.
- [x] 7.7 Run the Goals and Projects tours end to end on desktop.

## 8. Mobile verification (viewport < 768px, same data states)

- [x] 8.1 `/plan/goals` at 360px: chip row first (scrolls horizontally, nothing clipped), status filter row second, icon-only controls third (wrapping if needed); no project card widget and no New project.
- [x] 8.2 Scope selection, URL update, reload, Create goal prefill (contextual icon and bottom-nav button), and empty-project copy behave as on desktop; reorder mode still works while scoped.
- [x] 8.3 `/plan/projects` on mobile: row menu items and Manage goals sheet usable at touch size; row tap opens scoped Goals.
- [x] 8.4 Run the Goals and Projects tours end to end on mobile.

## 9. Gates

- [x] 9.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` all pass.
- [x] 9.2 If `add-goals-overview-density-option` has been archived first, re-copy its landed text for the two shared `goals-navigation` requirements into this change's MODIFIED blocks before `openspec sync` (design D10).
