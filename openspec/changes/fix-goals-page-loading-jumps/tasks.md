## 1. Loading state covers row membership

- [x] 1.1 Add `useGoalAttainmentState` returning `{ byGoalId, pending }` (pending while a detail query or a player-data live query is loading; failed or unsynced counts as settled); keep `useGoalAttainment` as the map-only wrapper; cover with `use-goal-attainment.test.tsx`.
- [x] 1.2 Expose `pendingProjectIds` from `useGoalProjects` and `requestedProjectId` from `useGoalsProjectScope`; extend `use-goals-project-scope.test.tsx`.
- [x] 1.3 Add `isGoalsListLoading` (`model/goals-data/goals-list-loading.ts`, unit-tested) and, in `goals-page.tsx`, treat the list as loading while a requested scope's project list or member list is pending, or (Unfulfilled/Reached) while attainment is pending; hide rows while loading; cover with page tests for the deep link and the attainment gate, and update the Reached-tab test.

## 2. Layout stability

- [x] 2.1 Move the estimates-failed notice and the no-farmable-demand line into `GoalsLateNotices`, rendered below the list; assert order in `goals-page.reorder.test.tsx`.
- [x] 2.2 Always render the mobile reorder and select toggles with a `disabled` prop (loading, reorder unavailable, no visible rows); cover loading and single-goal cases.

## 3. Verification

- [x] 3.1 Run the changed Vitest files, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, prettier on changed files, and `git diff --check`.

## Deferred / out-of-session

- Manual desktop (≥768px) and mobile (<768px) browser verification on a throttled connection with a populated account (some Reached goals, two projects) and a `?project=` deep link was not run in this session (no Aspire stack in this worktree); it needs a tracking issue before archive.
