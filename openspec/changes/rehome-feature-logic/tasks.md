# Tasks

Prerequisites: `test-harness-render-app` and `catalog-read-layer` archived; `tune-client-query-caching` merged. Each group is one PR; each ends green on `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm --filter web exec knip`.

## 1. Lint config and ui package cleanup

- [ ] 1.1 Change `max-lines` in `apps/web/eslint.config.js` to `["warn", { max: 800, skipBlankLines: true, skipComments: true }]` and remove the `eslint-disable max-lines` from `pages/library/ui/raid-bosses/raid-bosses-page.tsx`; verify `pnpm lint` passes with zero max-lines errors.
- [ ] 1.2 Delete `packages/ui/src/components/hover-card.tsx`, `hover-card.test.tsx`, `toggle.tsx` (keep `toggle-variants.ts` if `toggle-group.tsx` imports it) and their entries in the `packages/ui` exports map; verify `pnpm --filter @workspace/ui build` and `pnpm typecheck` pass.
- [ ] 1.3 Remove the 12 unused exports from `packages/ui/src/components/sidebar.tsx` (list in design.md decision 7) and update `sidebar.test.tsx`; verify `grep -r "Sidebar" apps/web/src` references only exported names and the ui tests pass.
- [ ] 1.4 Remove `src/fsd/entities/*/index.ts` from `apps/web/knip.json` `entry`, run knip, and delete every reported unused export (move test-only exports into the test file that uses them); verify knip exits 0.

## 2. Account-menu widget and navigation dedupe

- [ ] 2.1 `git mv` `account-card.tsx`, `account-menu-parts.tsx`, `guest-account-menu.tsx`, `theme-switcher.tsx`, `account-avatar.tsx`, `player-data-sync-button.tsx`, `catalog-sync-status-badge.tsx` and their tests from `app/providers` to `widgets/account-menu/ui`, add `widgets/account-menu/index.ts` exporting `AccountMenu`, `GuestAccountMenu`, `PlayerDataSyncButton`, `CatalogSyncStatusBadge`, `ThemeSwitcher`, and repoint `desktop-layout.tsx`, `mobile-layout.tsx` and the moved tests; verify `pnpm lint:fsd` passes and `app/providers` contains only `*-provider.tsx`, `auth-control.tsx`, `query-provider.tsx` and tests.
- [ ] 2.2 If `add-debug-info-export` has landed, confirm its export button renders inside the moved `account-card.tsx`; verify its tests still pass from the new path.
- [ ] 2.3 Move any navigation item shaping that is duplicated between `desktop-layout.tsx` / `desktop-section-navigation.tsx` and `mobile-layout.tsx` / `mobile-drawer-sub-item.tsx` into `nav-items.ts`, `resolve-active-navigation.ts` or `navigation-filter.ts`; verify both `desktop-layout.test.tsx` and `mobile-layout.test.tsx` pass and the desktop and mobile shells show the same section list for the same auth state in the Aspire-started app.
- [ ] 2.4 Update `shared/tour/general.tutorial.tsx` only if a `data-testid` the shell tour targets moved with the account-menu widget; verify the general tour steps still find their targets on desktop (>=768px) and mobile (<768px, same-origin iframe).

## 3. Dailies recommendation features

- [ ] 3.1 `git mv` `pages/dailies/model/{team-recommendations,hse-team-recommendations,hre-team-recommendations,team-recommendation-prefs}.ts` and tests to `features/team-recommendations/model`, add the slice `index.ts`, repoint `pages/dailies` imports and test mocks; verify the moved tests pass unchanged and `pnpm lint:fsd` passes.
- [ ] 3.2 `git mv` `pages/dailies/model/{shop-recommendations,shop-needs,use-shop-recommendations}.ts` and tests to `features/shop-recommendations/model`, add the slice `index.ts`, repoint imports; verify moved tests pass and `pnpm lint:fsd` passes.
- [ ] 3.3 Trim `features/goal-farming/@x/daily-raids`, `features/shop-rewards/@x/*` and `features/rank-lookup/@x/daily-raids` to the exports the moved features and `features/daily-raids` still import (rename the `@x` directory only if steiger requires the consumer name); verify knip and `pnpm lint:fsd` pass.
- [ ] 3.4 Render `/dailies/raids`, `/dailies/hse` and `/dailies/hre` through the `renderApp` harness with a populated roster fixture and verify the team and shop recommendation sections produce the same rows as the pre-move snapshot tests.

## 4. Legendary Events consolidation

- [ ] 4.1 For each file in `entities/legendary-event/lib`, count importers of its barrel exports outside the entity; `git mv` every file whose only consumer is `pages/legendary-events` (expected: `battle-preview`, `current-run`, `horde-strategy`, `lane-label`, `lane-teams`, `objective-label`, `team-support`, plus tests) into `pages/legendary-events/lib`; verify moved tests pass and `pnpm lint:fsd` passes.
- [ ] 4.2 Create `features/legendary-event-plan` by `git mv` of `features/legendary-event-teams`, then fold in `legendary-event-annotations`, `legendary-event-run-inputs` and `legendary-event-team-suggestions` (keep `use-plan-write-queue.ts` as the single write path); update the page imports and the feature `index.ts`; verify all four former slices' tests pass from the new location and `pnpm lint:fsd` passes.
- [ ] 4.3 Rewrite `entities/legendary-event/index.ts` to export only types, API, `queryOptions`, lifecycle, missions, master-table, team-size and run-inputs helpers used by more than one slice; verify the file is under 120 lines and knip reports no unused entity exports.
- [ ] 4.4 Render `/legendary-events/:id` overview, plan, run-history and master-table routes through `renderApp` with the existing clear-estimate fixtures; verify the rendered resolution, token plan and team cards match the pre-move snapshot tests.

## 5. Goals features

- [ ] 5.1 `git mv` `pages/goals/model/{goals-data,estimate,attainment,blockers,farming,insights,projects,shared}` to `features/goal-planning/model`, add `features/goal-planning/index.ts`, repoint `pages/goals` imports and test mocks; verify moved tests pass and `pnpm lint:fsd` passes.
- [ ] 5.2 `git mv` `pages/goals/model/{goal-creation-form,goal-edit,target-edit}` and `pages/goals/ui/create-goal` to `features/goal-create`, export `CreateGoalSheet`, `CreateGoalLauncherProvider`, `useCreateGoalLauncher`, `CreateGoalPrefill`, the edit dialog and target-edit entry from its `index.ts`, and add `features/goal-planning/@x/goal-create` only for the planning helpers the form still needs; verify `pnpm lint:fsd` passes.
- [ ] 5.3 Repoint `app/layout/app-shell.tsx` and `app/routes.tsx` to `@/features/goal-create`, remove `CreateGoalSheet` and the launcher from `pages/goals/index.ts`; verify `grep -rn "@/pages/goals" apps/web/src/fsd/app` returns only the `routes` import in `app/routes.tsx` and `create-goal-scope.test.ts` passes.
- [ ] 5.4 Merge the `use-*.ts` hooks under `goal-creation-form` whose header comment says they were split "purely for max-lines" back into `use-create-goal-form.ts` (keep pure calc files `goal-preview.ts`, `goal-spec-builder.ts` separate) and remove the now-false comments; verify the creation-form tests pass and `pnpm lint` reports no max-lines error.
- [ ] 5.5 Merge the remaining max-lines-only splits (`plan-insights-calc.ts` note in `use-plan-insights.ts`, `use-goal-location-groups.ts`, `use-project-selection.ts`, `farming-strategy-field.tsx`, `goal-locations-field.tsx`, `goal-type-cards.tsx`, `unit-goal-form-fields.tsx`, `upgrade-goal-fields.tsx`, `features/daily-raids/model/use-effective-campaign-event-progress.ts`, `campaign-event-eligibility.ts`, `features/goal-farming/lib/goal-need.ts`) where the parent reads as one unit; verify `grep -rn "max-lines" apps/web/src --include=*.ts --include=*.tsx` returns no "purely for" comments and all tests pass.
- [ ] 5.6 Render `/plan/goals`, `/plan/projects` and `/plan/insights` through `renderApp` with the goals fixture, open the create-goal sheet from the shell quick action and from the goals page; verify both entry points open the same sheet and the existing `goal-creation-entry-points` tests pass.

## 6. Integration checks

- [ ] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm --filter web exec knip` and `git diff --check`; verify all pass and the test count equals the pre-change count (5,094 on 2026-10-20) plus or minus merged files only.
- [ ] 6.2 Start the stack through Aspire, sign in, and walk the shell tour, `/plan/goals`, `/dailies/raids`, `/legendary-events` at a viewport >=768px; verify navigation, account menu, create-goal sheet and recommendations render with no console errors.
- [ ] 6.3 Repeat 6.2 at <768px using a same-origin iframe; verify the mobile drawer, account menu and the same pages render the mobile layout with no console errors.
- [ ] 6.4 Update `tacticus-planner-docs/architecture/frontend.md` slice map to the new feature and widget names (docs repo, separate PR); verify the page lists `features/goal-planning`, `goal-create`, `team-recommendations`, `shop-recommendations`, `legendary-event-plan` and `widgets/account-menu`.

## Workflow follow-up

- Archive the change after all five PRs are merged and review threads are resolved.
