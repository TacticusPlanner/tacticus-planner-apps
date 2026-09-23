## 1. API integration and validation

- [ ] 1.1 Consume the paired API target-operation contract and goal revision in the goal entity public API; verify typed request/response tests for each supported kind and conflict response.
- [ ] 1.2 Reuse or extract goal-kind target validation for editing without cross-slice imports; verify creation and editing validation regression tests and `pnpm lint:fsd`.

## 2. Goal detail interaction

- [ ] 2.1 Add target editor to eligible Active/Paused goal detail views with stored-value prefill and disabled unsupported states; verify component tests for Rank, Ascension, Level, Ability, Upgrade, Unlock, and terminal goals.
- [ ] 2.2 Implement a separate Save target action that preserves unrelated drafts and retains target drafts on stale-revision or collision errors; verify success, concurrent update, duplicate milestone, and unsaved-notes tests.
- [ ] 2.3 Invalidate goal, project, progress, blocker, estimate, and daily-planning data after save and show stale-refresh errors distinctly from zero need; verify query/cache integration tests and changed Rank need fixtures.
- [ ] 2.4 Add real en/de/es/fr translations for editor labels, validation, success, conflicts, and stale-refresh copy in the existing goal namespace; verify all locale keys and rendered copy tests.
- [ ] 2.5 Update the Goals Joyride tutorial and its `tour.goals.steps.*` keys in all supported locales for target editing; verify desktop/mobile tour selector tests and translated step content.

## 3. Verification

- [ ] 3.1 Manually verify with the authenticated Aspire stack at one viewport below 768px and one at or above 768px: editable Rank and Ability goals, a conflicting Rank milestone, an already-reached target, an Unlock goal, a completed goal, and both Goals tour variants; verify persistence and recalculated Dailies after reload.
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
