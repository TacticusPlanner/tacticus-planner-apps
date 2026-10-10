## 1. Membership helper

- [x] 1.1 Add `changeProjectMembership(projectId, change)` to `entities/project/model/change-project-membership.ts` and export it. It reads the project's members, applies `change`, sends one `updateProjectGoals` with the read set as `expectedGoalIds`, re-applies `change` once to the `currentGoalIds` of a `projectMembershipStale` 409, sends nothing when the set is unchanged, and rethrows every other rejection. Verify with `change-project-membership.test.ts`: one request with the expected set, no request for a no-op, one retry on stale, no retry on `lastProjectMembership`.

## 2. Goal actions

- [x] 2.1 Rewrite `addToProject` in `use-goal-actions.ts` to call `changeProjectMembership` once for the whole selection and toast the server-side added count; a rejection adds nothing and shows one `membershipErrorText` error. Verify in `use-goal-actions.test.tsx`: one call for three goals, the count excludes the existing member, and a rejection gives one error and no success.
- [x] 2.2 Add `removeFromProject(rows, project, destination?)`. It adds last-membership rows to `destination` first, then removes every row from `project`. It toasts by case: one goal removed, one goal moved, many removed, or many removed with some moved. A destination rejection removes nothing. Verify in the same test file: the request order (destination, then source), the final memberships, a single-row toast naming the goal, and a destination conflict leaving the source untouched.
- [x] 2.3 Add `membershipErrorText` to `project-conflict-copy.ts` (slot conflict → `projectConflictText`, `lastProjectMembership` → `removeLastMembership`, otherwise the server message or `actionError`) and `isOnlyMemberOf` to `project-removal.ts`. Verify with unit tests for each branch.

## 3. Goals page UI

- [x] 3.1 Add `project-removal-flow.tsx` (`useProjectRemovalFlow`). It splits a request into plain removal or picker/create first, renders the destination `ProjectPickerDialog` and the `ManageProjectsSheet` once, and exposes `ProjectRemoval` (`project`, `available`, `request`). Mount it in `goals-page.tsx` for the scoped project.
- [x] 3.2 Thread `projectRemoval` through `GoalsListProps`, `GoalsTable`/`GoalRowCells` and `GoalsMobileCards` to `GoalRowActions`. Add the "Remove from this project" / "Move to project" item between Pause/Resume and Delete, disabled until memberships and projects are loaded. Pass the project name to `DeleteGoalDialog`, which then shows `goals.delete.projectAlternative`.
- [x] 3.3 Add the scoped-only bulk "Remove from project (N)" button to `GoalsBulkActions` (`FolderMinus`). It counts the selected rows whose memberships are known, and `GoalsBulkControls` routes it through `projectRemoval.request(rows, clearSelection)`. Verify in `goals-bulk-actions.test.tsx`: absent when unscoped, the count and the rows it acts on, and disabled while projects load.
- [x] 3.4 Verify in `goals-page.test.tsx`: Add to project sends one `updateProjectGoals` and no `updateGoalProjects`; the unscoped page has no removal; the scoped row menu removes without a picker; a last-project row asks for a destination and sends destination then source; bulk removal moves only the last-project goal and clears the selection; the scoped delete confirmation names the alternative.
- [x] 3.5 Add the new strings to en/de/es/fr `common.json`.

## 4. Verification

- [x] 4.1 `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run`, `git diff --check`.
- [x] 4.2 Manual check on the local Aspire stack: bulk Add to project with several goals is one request; scoped row Remove and Move; scoped bulk Remove with a last-project goal; desktop and mobile.
