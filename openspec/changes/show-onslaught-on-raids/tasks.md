## 1. Implementation

- [x] 1.1 Export `buildOnslaughtRuns` from `plan-day-cells.ts` and extract `OnslaughtRunList` from `plan-onslaught-runs.tsx`; verify the Schedule day-card tests still pass.
- [x] 1.2 Render the Onslaught section on `TodayPage` from `raids.today` with the rounded-up token badge; verify with `dailies-pages.test.tsx` (populated and empty).
- [x] 1.3 Add `today.onslaughtSummary` and `tour.today.steps.onslaught` in en/de/es/fr, and the tour step in `today.tutorial.tsx`; verify with the tutorial and translation tests.
- [x] 1.4 Run the targeted tests, `pnpm typecheck`, eslint on changed dirs, knip, `pnpm lint:fsd` and `git diff --check`; full suite left to CI per project instructions.

## 2. Desktop verification (≥768px)

- [ ] 2.1 With goals that need Onslaught shards: the section sits after the raid lanes with rows in priority order and the token badge; it matches Plan > Schedule's day 1.
- [ ] 2.2 With no Onslaught need: no section; the tour skips the step.

## 3. Mobile verification (<768px)

- [ ] 3.1 With goals that need Onslaught shards: the section stacks below the lanes and above Shop recommendations; rows keep their icon and text.

## Notes

- Manual verification needs the Aspire stack, which was not available in the session that made this change.
