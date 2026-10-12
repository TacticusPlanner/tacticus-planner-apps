## 1. Rank range

- [x] 1.1 In `setDraftRange`, auto-adjust the other side only when the moved side reaches or crosses it. Keep the ceiling and floor handling.
- [x] 1.2 Update the hook tests: crossing still advances or retreats the other side, a widening move keeps it, and the ceiling and floor cases still pass.

## 2. Onslaught yield in Edit goal

- [x] 2.1 Extract the per-run yield and reward-key helpers into `onslaught-yield.ts`, and use them from `use-progression-preview.ts` with no behaviour change.
- [x] 2.2 Compute the yield in `use-goal-edit-acquisition.ts` (saved progress, rewards, current progression with the goal's start as fallback) and pass it to `AcquisitionSourceField`.
- [x] 2.3 Unit-test the helper, and add Edit-dialog tests for both the saved-progress case and the no-progress case.

## 3. Restricted tooltip

- [x] 3.1 Carry an optional `{ unitName, goalType }` label on `PrerequisiteNotReached`, resolved from the loaded dependency detail in `use-goals-overview-metrics.ts`.
- [x] 3.2 Render the named sentence (with the generic fallback), and start the Restricted tooltip with the explanation line. Add both keys to en/de/es/fr.
- [x] 3.3 Test the reason text, the explanation line, and one line per named prerequisite.

## 4. Verification

- [x] 4.1 Run `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run` and `git diff --check`; verify all pass.
- [x] 4.2 Manually verify on the Aspire stack, desktop and mobile:
  - Library > Characters: the range widens from either side, and crossing pushes the other side.
  - Edit an Ascension goal: the Onslaught yield shows with saved progress, and the prompt shows without it.
  - A goal with an unreached prerequisite: the Restricted tooltip shows the explanation and names the prerequisite.
  - The no-saved-progress Edit dialog case was not reproduced by hand (it would mean clearing the account's Onslaught progress); the Edit-dialog test covers it.
