## 1. Optimistic removal primitive

- [x] 1.1 Create `optimistic-goal-removal.ts` (sibling to `optimistic-goal-status.ts`) exporting `applyOptimisticGoalRemoval(data: unknown, goalId: string): unknown`, filtering the matching entry out of the flat `{ goals: GoalSummary[] }` shape and the project-membership-wrapped `{ goals: ProjectGoalSummary[] }` shape (matching via `.goal.goalId`), leaving a single cached `GoalDetail` object untouched, and returning the same reference when nothing changes. Verify by reading the file against `optimistic-goal-status.ts`'s existing shape handling.
- [x] 1.2 Add `optimistic-goal-removal.test.ts` mirroring `optimistic-goal-status.test.ts`'s structure: a flat-list entry is filtered out and sibling entries keep their reference; a project-membership-wrapped entry is filtered out by `.goal.goalId`; a non-matching `GoalDetail` and a non-matching list both return the same reference unchanged. Verify with `pnpm --filter web test:run optimistic-goal-removal`.

## 2. Wire the optimistic patch into `remove()`

- [x] 2.1 In `use-goal-actions.ts`, add a `patchRemovalCache(goalId: string)` helper alongside `patchStatusCache`, calling `queryClient.setQueriesData` for both `goalQueries.all()` and `projectQueries.all()` with `applyOptimisticGoalRemoval`. Verify by reading the updated file.
- [x] 2.2 In `remove()`, call `patchRemovalCache(goalId)` before awaiting `run(goalId, () => deleteGoal(goalId))`; on failure, call `queryClient.invalidateQueries` for both `goalQueries.all()` and `projectQueries.all()` to restore the authoritative list (per design.md's "Decisions" — a captured-position revert isn't available the way `setStatus`'s is); on success, drop the existing `toast.success(t("goals.toasts.deleted"))` call. Verify by reading the updated `remove()` function against `setStatus`'s existing optimistic-then-revert shape.

## 3. Tests

- [x] 3.1 Update `goal-row-actions.test.tsx`'s existing delete test(s) (around the "opens the confirm dialog and deletes on confirm" case) to assert the row/goal disappears from the rendered list immediately after confirming, before `deleteGoal`'s mocked promise resolves, and that no success toast is shown on the resolved-success path. Verify with `pnpm --filter web test:run goal-row-actions`.
- [x] 3.2 Add a test for the failure path: `deleteGoal` rejects, the goal reappears (query refetch), and an error toast is shown (existing `run()` error-toast behavior — confirm it still fires for `remove()`'s call). Verify with the same test run.
- [x] 3.3 If any other test asserted `toast.success(...)` firing on a successful delete (search `goals.toasts.deleted` across `apps/web/src/fsd/pages/goals`), update it to assert the toast does NOT fire. Verify with `pnpm --filter web test:run goals`.

## 4. Gates

- [x] 4.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
