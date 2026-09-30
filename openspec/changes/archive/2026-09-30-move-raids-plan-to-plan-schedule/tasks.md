## 1. Move shared Raids UI to the feature layer (files as of `main`; if `feat/raids-plan-v1-strip-and-planner-alignment` has merged, also move `pages/dailies/ui/plan/*`, `model/plan-day-cells.ts`, and `plan-blockers.tsx`)

- [x] 1.1 Move `pages/dailies/ui/raid-schedule.tsx`, `resource-card.tsx`, `raid-state.tsx` (and their tests) to `features/daily-raids/ui/` and export `RaidSchedule`, `RaidState`, `UnitIcon`, `ResourceCard`, `GoalTargetBadge` from `features/daily-raids/index.ts`; verify the moved tests pass unchanged.
- [x] 1.2 Repoint `today-page.tsx` to import them from `@/features/daily-raids`; verify `today-page` tests pass and `pnpm lint:fsd` reports no page-to-page or forbidden feature imports.

## 2. Schedule page under Plan

- [x] 2.1 Move `raids-plan-page.tsx` → `pages/goals/ui/schedule/schedule-page.tsx` (`SchedulePage`) with local `projectId` state, `useProjects()`, a right-aligned `[ProjectSelect allowAll][PlanningSettingsTrigger]` row, and the settings dialog state; keep `useTranslation("dailies")`; verify the moved page tests pass plus new tests for default "All goals", narrowing on selection, project-list failure, and no projects.
- [x] 2.2 Move `raids-plan.tutorial.tsx` → `pages/goals/ui/schedule/schedule-page.tutorial.tsx` (`useScheduleTutorial`), registered from `SchedulePage`; keep `tour.raidsPlan.*` keys; verify the tutorial test enumerates desktop and mobile steps.
- [x] 2.3 Add `{ path: "schedule", element: <SchedulePage /> }` to `pages/goals/route.tsx` and the `/plan/schedule` child to `nav-items.ts` with `goals.tabs.schedule` / `goals.tabs.scheduleDescription`; update `route.test.tsx`, `section-tabs.test.tsx`, and the nav search/drawer tests to expect four Plan children; verify they pass.
- [x] 2.4 Add `goals.tabs.schedule` and `goals.tabs.scheduleDescription` to `common.json` in en/de/es/fr with real de/es/fr translations; verify the translation-key tests pass.

## 3. Dailies › Raids becomes Today

- [x] 3.1 In `pages/dailies/route.tsx`, render `TodayPage` at `raids` and delete the `raids/today`, `raids/plan`, and index-redirect children; verify the dailies route test asserts `/dailies/raids` renders Today and `/dailies/raids/today` / `/dailies/raids/plan` hit the not-found handling.
- [x] 3.2 Move the project selector + Planning Settings row and dialog state from `raids-layout.tsx` into `today-page.tsx`, delete `raids-layout.tsx` (+ test) and the `RouteTabs` export in `dailies-layout.tsx`; verify `today-page` tests cover the row (labeled selector on desktop, icon-only on mobile, trigger opens the dialog) and `dailies-layout.test.tsx` passes.
- [x] 3.3 Change `pages/home/ui/raids/raids-widget.tsx` links to `/dailies/raids`; update its test.
- [x] 3.4 Remove `dailies:raids.tabs.*` keys in all four locales and update the Today tour step that referenced the Today/Plan sub-tabs (copy + `tour.today.steps.*` keys in en/de/es/fr); verify translation-key and tutorial tests pass.

## 4. Desktop verification (viewport ≥ 768px, Aspire stack, signed-in account with Active goals in ≥ 2 projects and a plan longer than 3 days)

- [x] 4.1 Plan section: sidebar flyout, navigation search, and breadcrumb list Schedule; `/plan/schedule` renders the same summary, density toggle, Show all days, day columns, and Raided split as before the move.
- [x] 4.2 Schedule selector defaults to All goals, narrows on selecting a project, resets on reload, and its Planning Settings trigger opens the shared dialog; changing daily energy there is reflected on Goals and Today.
- [x] 4.3 `/dailies/raids` renders Today with no sub-tab bar; the selector + Planning Settings row is right-aligned; Today's selection is independent of Schedule's; `/dailies/raids/plan` and `/dailies/raids/today` land on the not-found handling; the home Raids widget opens `/dailies/raids`.
- [x] 4.4 Run the Schedule and Today tours end to end on desktop.

## 5. Mobile verification (viewport < 768px, same data states)

- [x] 5.1 Plan header tabs list Goals, Projects, Insights, Schedule; `/plan/schedule` renders with the icon-only selector and Planning Settings trigger; density toggle is icon-only; day columns scroll/stack as before.
- [x] 5.2 `/dailies/raids` on mobile: Today renders with the icon-only selector row and no sub-tabs; the drawer's Dailies › Raids entry opens it.
- [x] 5.3 Run the Schedule and Today tours end to end on mobile.

## 6. Gates

- [x] 6.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` all pass.
