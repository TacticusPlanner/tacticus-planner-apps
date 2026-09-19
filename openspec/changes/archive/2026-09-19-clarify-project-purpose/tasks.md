## 1. Prerequisite

- [x] 1.1 Confirm the companion `clarify-project-purpose` change in `tacticus-planner-api` is applied and its `startPaused` field is present on `POST /me/goals/combined` in the regenerated `artifacts/openapi`; do not start section 2 before it is.
- [x] 1.2 Confirm `fix-project-detail-grouping` has landed before starting sections 4 and 5. It is mid-apply (19 of 33 tasks, untracked `project-detail-goals.tsx` in the working tree) and its `project-management` delta replaces the project-detail header — the region tasks 4.1–4.4 edit. If it is still in flight, rebase on its result rather than editing `project-detail-page.tsx` in parallel.

## 2. Start-paused option in goal creation

- [x] 2.1 Add optional `startPaused?: boolean` to `CreateCombinedGoalsRequest` and `CreateGoalRequest` in `entities/goal/model/types.ts`, matching the API contract; verify `pnpm typecheck` passes.
- [x] 2.2 Add start-paused state to the creation form, defaulting to off. Declare it with the other creation-form fields **above** the `useGoalFormReset` call at `use-create-goal-form.ts:194` and clear it inside `useGoalFormReset` — not alongside `createAnother`, which lives in `useGoalSubmit` (constructed at line 332, after the reset hook, with `resetForm` passed _into_ it) and therefore cannot be cleared by a reset. Verify with a unit test that a reset clears start-paused while leaving `createAnother` set.
- [x] 2.3 Send the flag from `use-goal-submit.ts`, omitting the field from the request body when the box is unchecked; verify with a test asserting the submitted body has no `startPaused` key by default and `startPaused: true` when chosen.
- [x] 2.4 Render the control as a `Checkbox` + `Field`/`FieldLabel` pair directly below `GoalProjectsField` in `pages/goals/ui/create-goal/unit-goal-form-fields.tsx`, with a helper line stating the goal is created but kept out of daily planning until resumed; verify it renders at both breakpoints without hover or an opened control.
- [x] 2.5 Add a test covering a combined submission (a goal plus its auto-suggested prerequisites) with the flag on, asserting one request carries the flag for the whole set.

## 3. The Projects dashboard explains what a project is

- [x] 3.1 Add a short lead paragraph at the top of `projects-list-page.tsx`'s content area describing a project as a named, separately ordered selection of the account's goals, and why an account may keep more than one. Render it only when the user has at least one project — the empty dashboard is covered by task 3.3, and `project-management`'s "No project exists yet" requirement keeps that state to explanatory copy plus Create project, so an unconditional paragraph would show the explanation twice. Verify it renders on arrival with no page heading introduced (`project-management` forbids one).
- [x] 3.2 Add a line in the Current plan section stating that Current plan is the project Dailies and Insights use by default, and that it does not make goals active or inactive; verify it renders whenever a Current plan project exists.
- [x] 3.3 Reword `goals.project.noProjectDescription` so the empty dashboard answers the same "what is this for" question as the populated one; verify against the empty-dashboard test in `projects-list-page.test.tsx`.
- [x] 3.4 Add tests asserting both explanations are present in the rendered output and are not inside a tooltip, popover, or collapsed element.

## 4. Project detail presents its goals as a selection

- [x] 4.1 Read the account-wide goal total from `goalQueries.list(false)` in `project-detail-page.tsx` and express the project's goal count against it ("12 of your 40 goals"). Both sides must count non-archived goals: switch the project side from `allRows.length` (`project-detail-page.tsx:315`, which includes archived members) to the already-computed `nonArchivedRows`, since `list(false)` excludes archived goals. Verify with a test on a project holding both non-archived and archived members that the ratio counts only the non-archived ones and the project number never exceeds the account number.
- [x] 4.2 Fall back to the plain `goals.project.unitGoalSummary` wording while the account total is pending or failed, never rendering a zero or guessed total; verify with a test that holds the account query pending.
- [x] 4.3 Give an empty project an empty state saying this project has no goals yet and naming Add goals and Create goal as the ways to fill it; verify with a test for a project with no members while the account has goals.
- [x] 4.4 Review the project detail header and empty-state copy for any wording implying membership activates a goal, and remove it; verify by test assertion on the rendered strings.

## 5. Membership surfaces state what membership does not do

- [x] 5.1 Add a helper line to `GoalProjectsField` stating that membership changes only which projects contain the goal and that pausing or resuming is a separate per-goal action; verify it renders in both the creation sheet and `goal-detail-edit-form.tsx`, at both breakpoints.
- [x] 5.2 Add a test asserting that editing a goal's memberships from the edit form issues no status mutation, covering `goal-project-membership`'s "Editing membership leaves status alone" scenario on the client side.

## 6. Tours

- [x] 6.1 Update `projects-list-page.tutorial.tsx` step copy so it states what a project is rather than only how the dashboard is arranged; verify `projects-list-page.tutorial.test.tsx` still passes and covers the changed keys.
- [x] 6.2 Update `project-detail-page.tutorial.tsx` step copy so the header step mentions that a project holds a selection of the account's goals; verify its tutorial test.
- [x] 6.3 Leave `create-goal-sheet.tutorial.tsx` unchanged and confirm it still holds only its single acquisition-sources step. The start-paused control carries its own visible helper text, and both the proposal and design rule out new tour steps; this task exists to make that a checked decision rather than an omission.

## 7. i18n

- [x] 7.1 Add every new key under `goals.project.*`, `goals.create.*`, `tour.projectsList.*`, and `tour.projectDetail.*` to `apps/web/public/locales/en/common.json`, and remove any key the rewordings replace. `tour.createGoal.*` is not touched.
- [x] 7.2 Write real de, es, and fr translations of the same keys at the quality of the surrounding namespaces; verify no English text remains in the de/es/fr files for these keys.
- [x] 7.3 Check the new Spanish and German strings against the containers they render in — per Cluster 11 (`LOC-07`), Spanish is this project's text-expansion stress case — and adjust the copy or its container so nothing truncates at either breakpoint.

## 8. Manual verification

Required data states: an account with at least two projects where the Current
plan is **not** the Default project, one project holding a subset of the
account's goals **including at least one archived member**, one project with no
goals at all, and a signed-in session against the local Aspire stack.

- [x] 8.1 Create a goal whose only selected project is not the Current plan and confirm it is created Active — check it under the **Active** status filter, not Unfulfilled. Unfulfilled is an attainment split (`filteredNonArchivedRows` where `!isReached`), so a Paused goal appears there too and the check would pass even if the API half had regressed.
- [x] 8.2 Create a goal with start-paused on and confirm it appears under the **Paused** status filter, is absent from the Current plan's Dailies, and can be resumed from its row action.
- [x] 8.3 Confirm the dashboard explanations, the project-detail "N of your M goals" summary, and the empty-project state read correctly at one viewport below 768px and one at or above 768px. Use a project holding archived members for the summary check, so the non-archived-on-both-sides rule from task 4.1 is exercised.
- [x] 8.4 Run both project tours at the same two viewports and confirm each step's copy matches what is on screen.

## 9. Gates

- [x] 9.1 `pnpm test:run`
- [x] 9.2 `pnpm typecheck`
- [x] 9.3 `pnpm lint`
- [x] 9.4 `pnpm lint:fsd`
- [x] 9.5 `git diff --check`
