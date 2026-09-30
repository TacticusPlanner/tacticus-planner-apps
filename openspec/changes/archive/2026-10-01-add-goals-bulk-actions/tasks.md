## 1. Bulk mutations

- [x] 1.1 Add `setStatusMany(targets: {goalId, previousStatus}[], status)` to `use-goal-actions.ts`: hold every id pending for the whole loop, patch optimistically up front, run each `updateGoalStatus` sequentially and silently, revert each failed id, toast `statusChangedPartial` once when any fail, no toast when all succeed. Verify with a new `use-goal-actions.test.ts` covering all-succeed (no toast, all patched) and one-fails (that id reverted, one toast with `succeeded`/`total`).
- [x] 1.2 Add `removeMany(ids)`: patch removal for every id, run `deleteGoal` sequentially, invalidate both query prefixes once if any failed, one aggregate error toast, no success toast. Verify in the same test file: all rows patched out before the first request resolves; a failed id triggers the invalidation and one toast.
- [x] 1.3 Add `addToProject(rows, project)`: skip rows already members, call `updateGoalProjects(goalId, [...currentIds, project.projectId])` per row sequentially, invalidate both prefixes on success, one success toast naming project and added count (new key `goals.toasts.goalsAddedToProject`), one aggregate error on partial failure. Verify in the test: member rows skipped, count in the toast equals added rows, existing memberships preserved in the request body.

## 2. Row menu and table layout

- [x] 2.1 Rewrite `goal-row-actions.tsx` as one `DropdownMenu` for both platforms (Edit, Pause|Resume, separator, Delete destructive; items disabled while pending; Pause/Resume omitted for Reached, Completed, Archived). Delete the project move/remove branch, `useMoveGoalFromProject` usage, and the `ManageProjectsSheet`/`MoveToProjectDialog` mounts. Verify `goal-row-actions.test.tsx` is rewritten to open the menu and assert the item set per status/reached, the cascade still runs from the menu's Pause, and no `goal-row-pause-*` icon buttons exist.
- [x] 2.2 In `goal-table-row.tsx`: render the menu trigger at the trailing edge of the Character cell (`ml-auto`, `data-testid="goal-row-menu-<id>"`), remove the Actions cell, swap the Status · Done by and Remaining cells, drop `max-w`/`max-h` from the Remaining cell and give it `min-w-[260px]`. Verify `goals-list.test.tsx` asserts the header order Character, Projects, Goal, Progress, Status · Done by, Remaining, no "Actions" header, and the menu trigger inside the Character cell.
- [x] 2.3 In `goals-list.tsx`: make the leading cell unconditional (remove `hasLeadingCell`), add the header select-all `Checkbox` (`goals-select-all`, checked/indeterminate from `selection` vs `rows`), and put a per-row `Checkbox` (`goal-row-select-<id>`, accessible name "Select {{entity}}") before the priority number. Verify `goals-list.test.tsx` covers select-all across two groups, indeterminate on partial, and a row checkbox toggling without firing the drag handle.
- [x] 2.4 In `goal-resource-chips.tsx` delete `MAX_VISIBLE_CHIPS`, the `hidden`/overflow `<li>`, and the `<ul>` clip classes so every chip renders and wraps. Verify `goal-resource-chips.test.tsx`: a MoW ability goal with twelve resources renders twelve `goal-resource-chip` items and no `goal-resource-chips-overflow`.
- [x] 2.5 Move `UnavailableMaterials` from `goal-row-shared.tsx` into `status-badge.tsx`, add an optional `estimate` prop to `BlockedIndicator` that appends the materials rows to its tooltip, and make `EstimateCell` return `null` for a Blocked estimate. Pass `estimates.get(goalId)` from both the table cell and the mobile card. Verify `status-badge.test.tsx` shows the material rows inside the tooltip content and `goals-list.test.tsx` shows no `goal-unavailable-materials` in the cell.

## 3. Desktop toolbar and selection

- [x] 3.1 Add `selection` state, `onToggleSelected`, `selectAllVisible`, and `clearSelection` to `goals-page.tsx`; clear via an effect on `[tab, goalType, scopeId, group]` and after every bulk action; thread `selection`/`onToggleSelected` through `GoalsListProps`. Verify `goals-page.test.tsx`: selecting two rows then changing the status filter leaves nothing selected; a reorder drop keeps the selection.
- [x] 3.2 Create `goals-board/goals-bulk-actions.tsx` (`GoalsBulkActions`): four buttons with icons, target sets computed from `selection`, row statuses, `reachedByGoalId` and `pendingIds`; disabled when a set is empty; labels carry the count (`goals.bulk.pause` etc. with `count`); Delete opens `DeleteGoalDialog` with `count`; Add to project opens the picker. Verify a new `goals-bulk-actions.test.tsx`: nothing selected → all disabled, no count; two Paused selected → Resume "(2)" enabled, Pause disabled; mixed selection → Pause acts only on Active non-reached ids.
- [x] 3.3 Restructure the desktop control area in `goals-page.tsx` into an actions row (`goals-actions-row`: Create goal, `GoalsBulkActions`, Planning settings pushed right) above a filters row (`goals-filters-row`: status filter, Type/Group, order hint). Verify `goals-page.test.tsx` asserts both rows, their order, and that Create goal is the first control of the actions row.
- [x] 3.4 Rename `move-to-project-dialog.tsx` to `project-picker-dialog.tsx`, parameterise its title/description, and use it as the Add-to-project destination picker (non-archived projects incl. Default; zero projects → `ManageProjectsSheet` create flow, created project becomes the destination). Verify `goals-page.test.tsx`: choosing a project calls `addToProject` with the selected rows; with no projects the create sheet opens instead.
- [x] 3.5 Add a `count` prop to `DeleteGoalDialog`, pluralise its title/description/confirm keys, and keep the single-row copy for `count: 1`. Verify `goals-page.test.tsx`: bulk Delete on four rows shows "4" in the dialog, confirming removes all four rows before requests resolve and clears the selection; cancel keeps the selection.

## 4. Mobile select mode

- [x] 4.1 Add `goals-board/goals-mobile-select-toggle.tsx` (icon-only, `aria-pressed`, `goals-mobile-select-toggle`) to the mobile icon row beside the reorder toggle, shown whenever `rows.length > 0`; add page-local select-mode state with mutual exclusion against reorder mode (`toggleSelect` exits reorder and vice versa; `exitSelect` clears the selection). Verify `goals-page.test.tsx` (mobile): entering select mode from reorder mode exits reorder; Done clears the selection.
- [x] 4.2 Add `goals-board/mobile-select-bar.tsx`: sticky bottom bar with "{{count}} selected" live region, `GoalsBulkActions` in its compact form, and a Done button; render it in `goals-page.tsx` while select mode is active. Verify `goals-page.test.tsx` (mobile): bar appears with "0 selected" and disabled actions on entry, actions enable after checking a card.
- [x] 4.3 In `goals-mobile-cards.tsx`: render a header `Checkbox` first when `selectActive`, keep the header menu on the right, drop nothing else. Verify `goals-list.test.tsx` (mobile): checkbox present only in select mode; tapping it selects without opening the menu.

## 5. i18n

- [x] 5.1 Add keys in `common.json` for the four locales: `goals.bulk.*` (pause/resume/addToProject/delete with `count` plurals, `selected` count, `selectAll`, `selectRow`, `selectMode`, `selectDone`), `goals.delete.*` pluralised, `goals.toasts.goalsAddedToProject`, `goals.project.addToProjectTitle`/`addToProjectDescription`, `goals.actions.edit`. Real de/es/fr translations at the quality of the sibling namespaces, no English placeholders. Verify with `pnpm typecheck` (resource types) and `pnpm test:run` (i18n key tests).
- [x] 5.2 Remove keys that no longer render (`goals.columns.actions`, the move-to-project copy that the picker no longer uses) from every locale and their TypeScript resource type. Verify `pnpm typecheck` and a grep for each removed key returns no usage.

## 6. Tour

- [x] 6.1 Extend `goals-page.tutorial.tsx`: desktop steps `select` (`goals-select-all`) and `bulkActions` (`goals-bulk-actions`) before `createGoal`; mobile step `select` targeting `goals-mobile-select-toggle`. Verify `goals-page.tutorial.test.tsx` asserts the new targets on both platforms and that the desktop `reprioritize` target is unchanged.
- [x] 6.2 Add `tour.overview.steps.select.*` and `tour.overview.steps.bulkActions.*` title/content to all four locales with real translations. Verify `pnpm test:run` (tutorial i18n tests).

## 7. Gates

- [ ] 7.1 Update the `add-goals-overview-density-option` proposal's archive-order note to name this change and its toolbar task to place the density toggle on the filters row. Verify `openspec validate add-goals-overview-density-option --strict` passes.
- [x] 7.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all pass.

## 8. Desktop verification (viewport at or above 768px; Aspire stack running; signed-in account with ≥ 12 goals including one Machine of War Ability goal needing badges, forge badges, components, gold and energy, one goal with a Blocked estimate, at least one Paused goal, one Reached goal, and ≥ 2 non-archived projects)

- [ ] 8.1 Table at 1280px with the sidebar open: six data columns in order, Remaining last and fully visible with no horizontal scroll, the MoW row shows every chip (grown height) while neighbours keep the fixed height. Screenshot saved.
- [ ] 8.2 Blocked-estimate row: no material lines in Status · Done by; hovering the Blocked badge shows reasons followed by the material rows.
- [ ] 8.3 Row menu: trigger at the end of the Character cell on every row; Active → Edit/Pause/Delete, Paused → Edit/Resume/Delete, Reached → Edit/Delete; menu Pause cascades to a sole prerequisite.
- [ ] 8.4 Selection: header checkbox selects all visible across groups (Group by type), indeterminate on partial; selection clears on status filter, type filter, scope chip and Group change; survives a drag reorder.
- [ ] 8.5 Actions row: Create goal first; bulk buttons disabled with nothing selected; counts on labels; bulk Pause over a mixed selection pauses only Active non-reached goals and leaves an unselected prerequisite Active; bulk Resume the same in reverse.
- [ ] 8.6 Bulk Delete on three goals: dialog names 3, rows vanish on confirm before the network resolves, no success toast, selection empty afterwards; cancel keeps the selection.
- [ ] 8.7 Add to project: picker lists non-archived projects with dots; choosing one adds the non-member selection, keeps existing memberships (Projects column shows both badges), success toast names project and count.
- [ ] 8.8 Tour on desktop walks the new select and bulk-actions steps in order without a missing target.

## 9. Mobile verification (viewport below 768px, e.g. 390px and 360px; same data states as group 8)

- [ ] 9.1 Icon row shows the select-mode toggle beside the reorder toggle; at 360px the row wraps with no clipped control.
- [ ] 9.2 Entering select mode shows a header checkbox on every card and the bottom bar with "0 selected" and disabled actions; entering reorder mode exits select mode and drops the selection, and vice versa.
- [ ] 9.3 Selecting two cards enables the applicable actions with counts; bulk Pause, Resume, Add to project and Delete each behave as in 8.5 to 8.7; Done exits the mode and clears the selection.
- [ ] 9.4 Card header menu lists Edit, Pause|Resume, Delete; no inline pause control anywhere on the card.
- [ ] 9.5 Blocked-estimate card shows no material lines; the Blocked badge tooltip carries them. MoW card shows every chip.
- [ ] 9.6 Tour on mobile walks the select step targeting the toggle and the unchanged reprioritize step.

## 10. Shared verification

- [ ] 10.1 Partial-failure path (block one request in devtools): status bulk reverts only the failed goal and shows one "Updated X of Y" toast; delete bulk restores only the failed goal with one error toast.
- [ ] 10.2 An account with zero non-archived projects: Add to project opens project creation and the created project receives the selection (use a fresh or reset test account; if unavailable, report the missing state rather than checking this off).
