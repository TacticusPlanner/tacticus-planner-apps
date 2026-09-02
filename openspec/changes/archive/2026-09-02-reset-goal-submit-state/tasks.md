## 1. Submission-state reset

- [x] 1.1 Update the goal-creation submission flow so a successful normal save returns its transient status to idle before closing the sheet and notifying the caller.
- [x] 1.2 Confirm the existing successful "Create another" path continues to reset the form, remain open, and return to an idle submission state.

## 2. Regression coverage

- [x] 2.1 Extend `CreateGoalSheet` component coverage with a persistently mounted, controlled sheet that completes a normal successful creation, closes, and reopens.
- [x] 2.2 Assert the reopened valid form has no submission spinner and an enabled submit action, while retaining the existing create-another success coverage.

## 3. Verification

- [x] 3.1 Run the focused `CreateGoalSheet` Vitest file.
- [x] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.
