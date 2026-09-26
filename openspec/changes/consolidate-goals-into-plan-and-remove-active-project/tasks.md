## 1. Prerequisites and contract

- [ ] 1.1 Confirm the paired API change `consolidate-goals-into-plan-and-remove-active-project` is applied (ActiveProjectId, `activate`, and `isActivePlan` removed) and `establish-global-goal-priority` is archived in both repos; verify with `openspec list` and the API's OpenAPI artifact.
- [x] 1.2 Regenerate the API client/contract types from the API's OpenAPI artifact and verify `isActivePlan` and the activate operation no longer exist in the generated output.

## 2. Routes and navigation

- [x] 2.1 Rename the section path to `/plan` and its children to `/plan/goals`, `/plan/projects`, `/plan/projects/:projectId`, `/plan/insights` in `app/layout/nav-items.ts`, `app/routes.tsx`, and `pages/goals/route.tsx`; make the index route `Navigate` (replace) to `goals`; delete `default-goals-landing.tsx`. Verify `route.test`, `section-tabs.test`, and `goals-layout.test` at both breakpoints.
- [x] 2.2 Add `mapLegacyGoalsPath` with a temporary `/goals` and `/goals/*` redirect route and apply it in `app/resolve-next-path` for the login `next` path; verify a unit test for every mapping (`overview` and `plan` to `goals`, project detail id preserved, query/hash preserved) and a login-`next` test.
- [x] 2.3 Update every hardcoded path: `app/layout/mobile-layout.tsx`, `app/layout/app-shell.tsx` (`matchPath` for goal-create prefill), `overview-project-quicknav.tsx`, `project-detail-page.tsx`, `projects-list-page.tsx`, `pages/home/ui/projects/projects-widget.tsx`, tour and search metadata; verify by grep that no `/goals` path literal remains outside `mapLegacyGoalsPath` and its test, and that the eight path-referencing tests pass (`section-tabs`, `posthog-provider`, `route`, `goals-layout`, `overview-project-quicknav`, `project-detail-page`, `projects-list-page`, `projects-widget`).
- [x] 2.4 Verify desktop last-visited-child memory and the mobile Plan bottom-bar entry land on `/plan/goals` on first entry, and that `posthog-provider` reports route group `/plan`.

## 3. Merge the Global Plan into Goals

- [x] 3.1 Rename the All Goals tab/page to "Goals" (`goals.tabs.overview` value in all locales) and remove Sort: delete the Sort control, `GoalSortValue`, and its state; order Active/Paused rows by `globalPriority` (via `inFlightInGlobalOrder`) followed by other goals by `updatedAt` descending. Verify `goals-page.test` for ordering, including Paused and terminal goals, and that no Sort control renders at either breakpoint.
- [x] 3.2 Add reorder to the Goals page: drag handles on visible Active/Paused rows, `useGoalOrderActions` with `spliceGoalOrder` for filtered lists, Group-confined drops, mobile reorder toggle/bar (`useMobileReorderMode`, scroll-into-view, reachable Done), `OrderConflictBanner`, and pending/saving feedback. Verify the A,B,C,D,E / visible A,C,E example in both drag directions, a grouped drop, a stale-revision conflict with reviewed retry, and per-drop persistence on a short mobile viewport.
- [x] 3.3 Give Goals plan-aware estimates: `usePlanInsights(null)` with the non-isolated goal detail sheet, an error/retry card, and the no-farmable note; verify estimates match Today for the same goals and that no extra fetch runs when the plan is already cached.
- [x] 3.4 Delete `pages/goals/ui/plan/*` (page, tutorial, tests) and the `plan` route/nav tab; verify `pnpm lint:fsd` and `pnpm typecheck` pass and no reference to `GlobalPlanPage` remains.
- [x] 3.5 Merge the Global Plan tutorial steps into the Goals tutorial (`tour.overview.steps.*`, both breakpoints) and remove `tour.globalPlan.*`; verify the Goals tutorial tests select the reorder, priority, and project-projection targets.
- [x] 3.6 Change the project detail's "Open Global Plan" link to a link to Goals (`/plan/goals`) with copy that project order is a view of the global order; verify `project-detail-page.test` at both breakpoints, including while mobile reorder mode is on.
- [ ] 3.7 Show the account-wide priority number on Active/Paused rows (not yet implemented in code): `globalPriority` as text in the leading cell beside the drag handle (desktop table, both densities) and in the mobile card header; none on Reached/Completed/Archived rows; the number is the whole-account position, never the visible index; add it to the row's accessible name ("Priority N"); verify with `goals-list` tests for unfiltered, filtered/grouped (non-consecutive), Paused, Compact, and mobile-card rows.
- [ ] 3.8 Make the number follow reorders: optimistic update through `applyPositionMove` on the Goals page and project detail (moved goal takes the displaced goal's number, goals between shift by one, rollback restores); verify the A,B,C,D,E / project A,C,E example on both pages and a rejected move.
- [ ] 3.9 Update the project detail order note to explain that numbers are account-wide positions and can have gaps (all four locales); verify with `project-detail-page.test` for a project with positions 1, 3, 5.

## 4. Remove the Active project (Current plan)

- [x] 4.1 Delete `isActivePlan` and `activateProject` from `entities/project` and every copy (`pages/goals/model/shared/types.ts`, `goal-detail-projects.ts`, `use-goal-projects.ts`), the `activate` action and "activated" toast in `use-project-actions.ts`, and the current-plan suffix in `project-marker.ts`; verify typecheck and knip.
- [x] 4.2 Remove Make current, the Current plan badge, section and note from `project-row.tsx`, `project-detail-header.tsx`, `projects-list-page.tsx`, `goal-visuals.tsx`, `move-to-project-dialog.tsx`, `project-summary-row.tsx`, and the project selectors; keep the Default marker and archive restriction; verify the updated `project-row`, `project-list`, `manage-projects-sheet`, `project-detail-page`, `projects-list-page`, and `goal-projects-field` tests.
- [x] 4.3 Replace `order-current-plan-first.ts` with Default-first ordering used by the Projects dashboard, `use-home-projects.ts`, and the quick-nav; verify with a unit test (Default first, then the existing order, archived excluded) and the widget/quick-nav tests.
- [x] 4.4 Verify the Default project is the only special project: renamable, not archivable, no delete control, listed first, and still the fallback home when a goal's last membership is removed: the client adds the Default membership first (`use-move-goal-from-project`) because the API rejects removing a goal's only remaining membership; verify with component tests.

## 5. Default scope becomes all goals

- [x] 5.1 Make `dailies-layout.tsx` and `insights-page.tsx` start with no project selected, add the "All goals" cleared state to `ProjectSelect`, and keep the selection session-scoped; verify it resets on reload and is unaffected by browsing a project route or the Goals page's project filter.
- [x] 5.2 Accept `projectId: string | null` in the Shops, Arena, Onslaught, and Salvage recommendation inputs: null uses the account's Active goals in global order, a project narrows to its members; add Shops' no-Active-goals empty state; verify with hook and page tests for null, selected project, and selection-cleared cases.
- [x] 5.3 Verify Insights defaults to all goals and a project filter only narrows results from the global run (no separate allocation); verify with `plan-insights-calc` and `insights-page` tests.
- [x] 5.4 Update the Home raids widget copy and states for the account-wide scope (no Active project wording, "no Active goals" state); verify `raids-widget` tests.

## 6. Copy and locales

- [x] 6.1 In en/de/es/fr `common.json`, `dailies.json`, and `events.json`, remove `goals.project.currentPlan`, `makeCurrent`, `currentPlanNote`, `archiveUnavailable` wording tied to Current plan, `goals.toasts.activated`, `goals.tabs.plan`, `goals.plan.*`, `tour.globalPlan.*`, and the Current plan mentions in tour copy; fix the "Active project" strings in the Home raids tour (`events.json`) and the Dailies empty state (`dailies.json`); verify typecheck (typed keys) and the locale completeness tests.
- [x] 6.2 Update the V1 import description in all locales to drop the "unless your default project is also your active project" note after verifying the API's actual import status behaviour (`V1GoalImportService`); verify the import dialog test and record the verified sentence.

## 7. OpenSpec and dependent changes

- [x] 7.1 Delete the superseded `make-global-plan-the-goals-landing` change directory; verify `openspec list` no longer shows it and `openspec validate --strict` still passes for the remaining changes.
- [x] 7.2 Reword `add-goals-overview-density-option` (Overview to Goals, check the compact layout against the drag-handle column), `create-project-from-all-projects-context` (remove "without changing Current plan", update quick-nav paths/labels), and `surface-goal-farming-guidance` ("Dailies-selected project" and "outside the currently selected plan"); verify each with `openspec validate --strict`.
- [ ] 7.3 At archive time sweep remaining "Overview", "All Goals", "Global Plan", and "Current plan" wording in the main specs (per the “Goals page” terms requirement); verify with a grep that none remain, and confirm the Purpose text of `goal-creation-entry-points` ("Goals Overview toolbar") is updated, since a delta cannot edit a Purpose. (`dailies-navigation`'s Raids-tab selector requirements are removed by this change's delta; `RaidsLayout` has no selector, so no code task is needed.)
- [ ] 7.4 Update PostHog dashboards/filters that use route group `/goals` to `/plan` when this ships (note in the PR).

## 8. Verification

- [x] 8.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
- [ ] 8.2 Manually verify with the authenticated Aspire stack below 768px and at/above 768px: landing on `/plan/goals` from a fresh session and from an old `/goals/overview` bookmark, priority-ordered Goals with reorder (unfiltered, filtered, grouped, mobile reorder mode, stale conflict), project detail reorder reflected on Goals, no Current plan control anywhere, Default project rename/no-archive, Shops/Arena/Onslaught/Salvage/Insights defaulting to all goals with a project filter, and the Goals and Dailies tours; verify persistence after reload.
