# Tasks

## 1. Run dates

- [x] 1.1 Add `guessMs` to each run start (announced start, else the previous run's guess + 175 days, never before the earliest estimate) and `legendaryEventRunWindow`. Verify that `run-dates.test.ts` covers Bile's and Uthar's guesses and an event with no announced run.

## 2. Run-based targets

- [x] 2.1 Add `throughRun` to `projectRewards` and a horizon to `stepTargets`, `ceilingOf`, `createPlanEvaluator` and `teamSwaps`.
- [x] 2.2 Keep the horizon on the draft (default: the first plan run); changing it resets the default ticks and the default target. Show the run picker, the horizon heading and the horizon's end on the Target step; the Review verdict names the horizon run.
- [x] 2.3 Tests: the ceiling and targets at a horizon, the run picker, and the existing wizard tests updated for the new heading and end line.

## 3. Hub

- [x] 3.1 List every run's date (guessed ones as "maybe ~<month>") on hub rows of unfinished events. Verify that the hub tests cover an upcoming event with one announced run.

## 4. Gates

- [x] 4.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`; all pass.
- [ ] 4.2 Manual check on the local stack at desktop and 390 px: the run picker wraps without horizontal scroll, and switching runs rechecks the verdicts.
