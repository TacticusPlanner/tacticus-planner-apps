## 1. Shared quick-action model

- [ ] 1.1 Start an isolated apps worktree after revamp-desktop-navigation and review these artifacts; verify the top-bar desktop launcher, mobile Menu search, current Goals scope behavior, and Schedule routes are present without disturbing existing work.
- [ ] 1.2 Add the shared app-layer inventory and localized filtering for the five actions; verify empty, whitespace/case, label, description, API keyword, mixed action/page, and no-match queries with unit tests.
- [ ] 1.3 Derive availability from authentication, sync status, page-tour registration/running state, and feedback readiness; verify guest filtering, disabled explanations, live state updates, and execution-time guards in tests.

## 2. Existing action integration

- [ ] 2.1 Wire Create Goal to the existing global callback; verify scoped Goals project preselection, unscoped defaults, cancellation, and lack of automatic saves in shell integration tests.
- [ ] 2.2 Mount the existing project-management form in shell create mode through its public API; verify launch from Library and Projects, blank fields, validation, pending/double-submit protection, successful cache refresh without navigation, no-project/list-failure states, cancellation, and save-error retry without data loss.
- [ ] 2.3 Wire Sync with Tacticus through existing shared sync behavior; verify exactly-once dispatch, in-progress disablement, status updates, retry and reauthentication parity, and existing button/shortcut regressions.
- [ ] 2.4 Wire Submit Feedback through the existing provider and expose readiness for unavailable-state feedback; verify widget opening without submission, anonymous access, identity-failure fallback, disabled unavailable state, and existing header/account-drawer entry points.
- [ ] 2.5 Expose page-tour availability/start through the shared tour public API and wire the action; verify registered-page versus no-tour behavior, running-state guard, correct current-page steps, and no general-tour substitution.

## 3. Search surfaces and modal handoff

- [ ] 3.1 Add Quick actions and Pages groups to the desktop search dialog and mobile Menu drawer using shared descriptors; verify ordering, action button/page link semantics, hidden empty groups, current-route search behavior, and unchanged auth filtering.
- [ ] 3.2 Implement guarded single-dispatch after search releases its modal layer and reset the query; verify no overlapping focus traps, target form focus, launcher focus return, cancellation, no implicit action from typing/Enter in the input, and no callback replay on rerender.
- [ ] 3.3 Keep desktop Ctrl/Cmd+K, Escape, and keyboard traversal while supporting touch and scrollable mobile results; verify mobile keyboard dismissal and first-tap interaction when handing off to goal/project forms, feedback, and page tours.
- [ ] 3.4 Add search/group/action/disabled-state copy in en/de/es/fr and update general.tutorial.tsx desktop search and mobile Menu guidance with corresponding translated tutorial keys; verify localization and automated tutorial coverage without automatically executing actions during tours.

## 4. Desktop verification

- [ ] 4.1 On the healthy Aspire stack at 768px and a wide viewport, use a signed-in account with a populated project-scoped Goals page and a no-project state; verify all five search actions, creation context, save/cancel/error behavior, search grouping, and preserved underlying route with browser evidence.
- [ ] 4.2 Verify keyboard open/filter/Tab/activate/Escape/focus return, syncing and reauthentication states, pages with and without tours, guest Library search, and an unavailable feedback widget; verify no duplicate operation or unintended feedback submission.
- [ ] 4.3 Run the desktop general tour and launch a page tour from search; verify updated guidance, target visibility, and interactive Next/Back/close controls without a residual search overlay.

## 5. Mobile verification

- [ ] 5.1 Below 768px, verify the same five actions from Menu search using a signed-in populated project scope and no-project state; test with the on-screen keyboard open, scroll results, and verify first-tap interaction and state preservation after every overlay transition.
- [ ] 5.2 Verify signed-out Library, syncing/disabled states, feedback readiness, tour absence/running states, form cancel/save/error flows, and reopening with an empty query; record browser evidence without submitting real feedback.
- [ ] 5.3 Run the mobile general tour and launch the current-page tour from search; verify drawer/keyboard dismissal, target readiness, Next/Back/close, and preserved existing account-drawer behavior.

## 6. Integration and completion

- [ ] 6.1 Run pnpm test:run, pnpm typecheck, pnpm lint, pnpm lint:fsd, pnpm build, and git diff --check; fix failures and record results, including regressions for existing goal/project, sync, feedback, search, and tour consumers.
- [ ] 6.2 Open the apps PR with desktop/mobile evidence, wait for complete CI and latest-commit CodeRabbit review, address actionable feedback, and verify resolved threads and checks on the final commit.
- [ ] 6.3 After review completion, sync and archive this change without replacing the desktop revamp's navigation requirements; validate the resulting specs and account for all remaining apps changes with openspec list.
