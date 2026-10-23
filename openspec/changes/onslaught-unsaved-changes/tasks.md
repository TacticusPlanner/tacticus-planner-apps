## 1. Draft state

- [x] 1.1 Move the Onslaught page's draft, save and 409 handling to `useRevisionedDraft` (draft = the three alliances, payload adds the saved revision)
- [x] 1.2 Disable Save unless the draft is dirty, and while saving

## 2. Leave prompt

- [x] 2.1 Render `UnsavedChangesGuard` while the draft is dirty
- [x] 2.2 Add `onslaught.leave.{title,description,stay,leave}` in en, de, es and fr

## 3. Tests

- [x] 3.1 Page test renders under a data router and uses the real `ApiError`
- [x] 3.2 Save disabled on load, enabled by an edit, disabled again when the edit is reverted
- [x] 3.3 Leave prompt: Stay keeps the draft, Leave navigates; no prompt without edits or after saving
- [x] 3.4 Existing save, sector-reset, conflict and not-set tests still pass (conflict leaves Save disabled)

## 4. Verification

- [x] 4.1 `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm build` and `git diff --check`
- [ ] 4.2 Manual check on `/my-game/onslaught`, desktop and mobile: Save state, in-app leave dialog, and the browser prompt on reload
