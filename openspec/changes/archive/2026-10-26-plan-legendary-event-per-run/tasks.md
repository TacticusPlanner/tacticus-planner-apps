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
- [x] 4.2 Manual check on the local stack at desktop and 390 px: the run picker wraps without horizontal scroll, and switching runs rechecks the verdicts. Checked on the Aspire stack with a synced roster on 26 Oct 2026, at 1280, 900 and 390 px (same-origin iframe): Bile upcoming with run 1 announced (heading, end line, picker, Run 2/3 guesses, verdicts rechecked and the default target moved once, an explicit target kept, targets lower with run-2 missions, Assumptions and Review follow the run, swap offers only from run 3); Uthar in run 2 (no upgrades before the run ends, "Ready for run 3" at run 3; clock shifted with a temporary dev hook, removed); Uthar in its last run (no picker, end line names run 3); hub cards at desktop and 390 px; de/es/fr. The archived hub card is covered by the hub test (no catalog event is finished). Fixes from the check: arrow keys on the run picker, and a tour step for it, skipped when the plan plays one run.
