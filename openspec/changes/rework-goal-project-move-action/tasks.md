## 1. Generalize the relocation logic to a chosen destination

- [x] 1.1 In `project-removal.ts`, change `planProjectRemoval` to take an explicit destination project (rather than always the account's Default project) and keep its occupied-slot conflict check and no-slot bypass working against that destination. Update its unit tests for a non-Default destination.
- [x] 1.2 Confirm the goal's edit-form membership editor (`goal-projects-field.tsx`) is unaffected: it does not call `planProjectRemoval` (it has its own separate `remove()`), so there is no call site there to update. Its existing tests should pass with no changes.

## 2. Let `ManageProjectsSheet` report the created project

- [x] 2.1 In `useProjectActions.create`, capture `createProject(...)`'s resolved `ProjectSummary` in a local variable inside the `run()` callback (mirroring `setGoalsStatus`'s existing `transitioned` capture in the same file), and return that captured value (or `null`) instead of `run()`'s raw `boolean`. Confirm `ProjectForm`'s existing call site (`result.then((ok) => ok && onSaved())`) still type-checks and behaves the same (truthy check).
- [x] 2.2 Add an optional `onCreated?: (project: ProjectSummary) => void` prop to `ManageProjectsSheet`/`ProjectForm`, invoked with the created project instead of the default `onSaved` close-only behavior when supplied.

## 3. Build the move-to-project flow

- [x] 3.1 Extend (or replace) `use-remove-goal-from-project.ts` with a `useMoveGoalFromProject` hook exposing: `otherProjects(goal, viewedProjectId)` (the account's other non-archived projects, Current plan included, for the picker), `moveToExisting(goal, viewedProject, destination)` (parameterized relocate, reusing the generalized `planProjectRemoval`), and `remove(goal, viewedProject)` (today's plain, destination-free removal when the goal has another membership already — unchanged behavior). Unit-test each path, including the occupied-slot conflict against a non-Default destination.
- [x] 3.2 Build the destination picker as a `Dialog` controlled by local state (`pickerOpen`), mirroring `DeleteGoalDialog`'s existing pattern in this same file: project list (Current plan included) + "Create new project…" row; selecting a project calls `moveToExisting`. Test: opening it lists the right projects, excluding the viewed project and any archived one, including Current plan when it isn't the viewed project.
- [x] 3.3 Wire "Create new project…" (and the no-other-projects single-action case) to open `ManageProjectsSheet` with `onCreated` calling `moveToExisting` against the newly created project. Test both the picker's "Create new project…" row and the zero-other-projects direct-open case.

## 4. Inline the row actions on desktop, keep mobile's menu

- [x] 4.1 In `goal-row-actions.tsx`, render the Move-or-Remove and Delete actions as icon buttons after the existing Pause/Resume icon when `!isMobile` (reuse `useIsMobile()` as the rest of this page does), instead of as `DropdownMenuItem`s. Move-or-Remove's icon/handler depends on whether the goal has another membership (`remove()`) or not (opens the picker dialog via `setPickerOpen(true)`). On mobile, keep Move-or-Remove and Delete as `DropdownMenuItem`s inside the "⋯" menu; Move-or-Remove's `onSelect` also just calls `setPickerOpen(true)` (`event.preventDefault()`, same as Delete's existing `onSelect={() => setConfirmOpen(true)}`) — the picker `Dialog` renders outside the `DropdownMenu` tree on both platforms, so it isn't affected by the menu closing.
- [x] 4.2 Compute whether the "⋯" menu would have any content (Archive or Unarchive applicable) and skip rendering the `DropdownMenu` entirely on desktop when it wouldn't. Mobile keeps rendering the full dropdown (Move-or-Remove, Delete, Archive/Unarchive) unconditionally, unchanged.
- [x] 4.3 Update `goal-row-actions.test.tsx` for: desktop icon buttons present and working (both the plain-remove and move-with-destination paths), "⋯" absent when empty on desktop, and mobile still rendering everything inside the dropdown as before.

## 5. Remove the old "nowhere to go" tooltip path

- [x] 5.1 The current disabled-with-tooltip block (`goal-row-actions.tsx`) covers two distinct `removalUnavailable` reasons: `lastMembershipIsDefault` (no destination — being removed by this change, since "Move to project" now always has an action) and `destinationUnknown` (the project list hasn't loaded yet — still required by `goal-project-membership`'s unchanged "Removal is unavailable while the destination cannot be determined"). Remove only the `lastMembershipIsDefault` case and its tooltip copy; keep the `destinationUnknown` case disabling the action while the project list is loading/failed/unauthenticated, without necessarily keeping its own visible tooltip text (a plain `disabled` state is sufficient once it's the only remaining reason). Remove `goals.project.removeLastMembership` from i18n only if nothing else reads it.

## 6. i18n

- [x] 6.1 Add/update strings across `en`/`de`/`es`/`fr` for: "Move to project" (action label + icon `aria-label`), the picker's "Create new project…" row, and the relocated/moved success toast naming the destination (may already exist as `goals.toasts.goalRelocated` — reuse if its wording still fits a user-chosen destination). Remove now-unused `goals.project.removeLastMembership` tooltip copy if task 5.1 confirms nothing else reads it. Validate JSON syntax on all 4 files.

## 7. Verify

- [x] 7.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and the scoped goals test suite (`pnpm exec vitest run src/fsd/pages/goals src/fsd/features/project-management`) for fast iteration - all clean.
- [x] 7.2 Before calling this done, run the full PR-validation set AGENTS.md requires: `pnpm test:run` and `pnpm build` (in addition to the lint/typecheck already run in 7.1) - all clean.
- [ ] 7.3 Manually verify on the running dev server (needs a running dev server; not done in this isolated worktree), desktop and mobile: a goal with 2+ memberships shows a plain Remove icon (desktop) / menu item (mobile) with no picker; a goal with 1 membership and other projects available opens the picker and moves it on selection; a goal with 1 membership and no other projects opens project creation directly and moves it there once created; the "⋯" trigger disappears on desktop when Archive/Unarchive both don't apply.
