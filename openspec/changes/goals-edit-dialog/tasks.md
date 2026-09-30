## 0. API client (after the companion API change `goals-edit-dialog` merges)

- [x] 0.1 Regenerate the API types from the OpenAPI artifact and add `editGoal` (`PUT /api/v1/me/goals/{goalId}/edit`) with its request/response types and typed 409 helpers to `entities/goal`; verify a client unit test for the request body shape (absent sections omitted) and the error mapping

## 1. Shared responsive dialog shell

- [x] 1.1 Add `ResponsiveDialog` (Dialog at or above 768px, bottom `Sheet` below) with Header/Title/Body/Footer parts, fixed header/footer, scrolling body and outside-click prevention option in `shared/ui`; verify with a unit test at both viewport widths (`useIsMobile` mocked)
- [x] 1.2 Generalize the combobox portal lookup (`unit-combobox`, `rarity-combobox`, project picker, raid-boss mobile picker) from "closest Sheet content" to "closest dialog or sheet content"; verify with tests that a popover list scrolls inside both shells

## 2. Create goal dialog

- [x] 2.1 Rehost `CreateGoalSheet` on `ResponsiveDialog` with the two-column body layout on desktop (wide fields spanning both columns, container-query based) and unchanged single column on mobile; verify the existing create tests pass with only shell-related assertions changed
- [x] 2.2 Update `create-goal-sheet.tutorial.tsx` selectors for the dialog on desktop and keep the mobile steps; verify the tutorial test covers one viewport below and one at or above 768px
- [x] 2.3 Verify prefill, "create another", blocker-launched creation and keyboard scrolling (`fix-create-goal-keyboard-scrolling` behavior) still work in the dialog via tests

## 3. Edit goal dialog

- [x] 3.1 Add the single `GoalEditDraft` and dirty comparison (target, notes, strategy, locations, sources, projects, priority position) and verify unit tests for each field's dirty state
- [x] 3.2 Inline the target editors into the dialog (no own Edit/Save/Cancel), hidden for Unlock and non-editable statuses; verify tests for Rank, Ascension, Ability, Upgrade, and Unlock
- [x] 3.3 Add the Priority position select (1..N over in-flight goals, hidden for goals without a position, shown for Reached goals) and verify tests for move up, move down, unchanged, and hidden cases using the A..E scenarios from the spec
- [x] 3.4 Implement `useGoalEditSave` (build the request from changed sections only, one `editGoal` call, apply the returned goal and order, one query invalidation) and verify tests for all-success, only-changed-sections request body, stale revision, membership conflict keeping the whole draft with nothing shown as saved, and stale order (409)
- [x] 3.5 Build `GoalEditDialog` (read-only unit/kind header, two-column field layout, skeleton, load-failure state, discard confirmation on Cancel/close/Escape, outside click blocked, Save disabled when unchanged or invalid) and verify component tests for each spec scenario in `goal-edit-dialog`
- [x] 3.6 Replace the goal-detail tutorial with an Edit dialog tutorial (desktop and mobile steps, i18n `tour.*` keys) and verify its test at both viewport widths

## 4. Entry points and removal

- [x] 4.1 Add the Edit action to `goal-row-actions.tsx` (desktop table) and the mobile card; make `GoalNameLink` non-interactive for opening; wire `editGoalId` state and `GoalEditDialog` into `goals-page.tsx` and `project-detail-page.tsx`; verify list and page tests that Edit opens the dialog and name/row activation does not
- [x] 4.2 Delete the read-only detail (`goal-detail-view`, header, estimate section, detail farming guidance and summary, metrics hook, dependency queries, unsaved dialog if superseded, footer, old sheet and their tests) and drop dialog-only props/computations from the pages; verify `pnpm knip` and `pnpm lint:fsd` report nothing left unreferenced
- [x] 4.3 Remove now-unused `goals.detail.*` i18n keys and add the new Edit dialog keys (title, priority label and options, read-only kind label, save/cancel/discard, save-failure and order-conflict messages) with real de/es/fr translations in the same namespace; verify locale key parity test passes
- [x] 4.4 Sweep `openspec/specs` and `apps/web` for remaining "goal detail"/"detail sheet" references (for example `goal-farming-guidance`'s XP-book requirement text, `dailies-onslaught-recommendations`) and reconcile them in this change's deltas or code; verify `grep` shows no stale reference

## 5. Verification

- [ ] 5.1 Desktop verification (viewport at or above 768px, Aspire stack, account with Rank, Ascension, Ability, Upgrade, Unlock, and a Reached goal): Create and Edit dialogs at 1440x900 and 1280x600 use two columns and keep header/footer visible; Edit shows only the specified fields; changing target + notes + priority saves in one action and the list updates; discard prompt; outside click does nothing; combobox lists scroll; Edit tour steps
- [ ] 5.2 Mobile verification (viewport below 768px, same data states): Edit opens as the bottom sheet from a card action with one column and the same fields and single Save; Create unchanged; tour steps
- [ ] 5.3 Conflict check with an account state that yields a project membership conflict on save (a second goal with the same target in a selected project): the dialog stays open with the whole draft and reloading shows that nothing was saved
- [x] 5.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm knip`, and `git diff --check` and verify all pass

## 6. Dialog compaction

- [x] 6.1 Remove the Projects helper paragraphs (membership description, activation note) and the Create paused description, and turn the priority hint, reached-target note, farming/shard location hints and level-requirement note into tooltips; verify tests that none of these paragraphs render and the tooltips carry their text
- [x] 6.2 Move "Create paused" into the Create footer next to "Create another goal" and order the footers Close/Cancel then the primary button; verify footer-order tests for Create and Edit
- [x] 6.3 Preselect the first Character (no prefill, never over a user choice, again after "create another") via `useDefaultUnitPreselect`; verify tests for no prefill, prefill wins, and the reset re-application, and that the tutorial tests pass
- [x] 6.4 Put "Current status" and "Goal type" side by side (`create-goal-status-and-types`) and tighten spacing in Create and Edit (header/footer padding, card spacing, gaps, inline project chips); verify the wrapper-class test, `pnpm test:run`, and a browser check at the available viewport
- [x] 6.5 Update en/de/es/fr strings (remove unused keys, add `startPausedHint`) and run `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck` and `git diff --check`
