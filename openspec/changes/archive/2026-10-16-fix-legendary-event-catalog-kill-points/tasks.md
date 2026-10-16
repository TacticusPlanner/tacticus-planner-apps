# Tasks

Paths are under `apps/web/src` unless stated. Commands from the repository root (`pnpm --filter web exec vitest run <file>` for one file). Group 3 needs the API half deployed to staging.

## 1. Fixture

- [x] 1.1 Regenerate the Uthar block of `test/fixtures/legendary-events.json` from the corrected `lres-votanuthar.json` (killPoints 30 / 34 / 43) and keep the header note in `test/fixtures/legendary-events.ts` accurate. Verify: a fixture test asserts Uthar's three lanes have `killPoints` equal to `defeatAll[0]` (30, 34, 43) and that Lysander's and Farsight's blocks are unchanged.

## 2. Worked examples

- [x] 2.1 Update `entities/legendary-event/lib/master-table.test.ts` and `pages/legendary-events/ui/master-table/master-table-page.test.tsx` to the recomputed figures (All: Uthar cell 5,004, total 11,538; Remaining: total 10,778; Estimated: Uthar Alpha 1,110, Gamma 837, cell 1,947, total 3,095) with each derivation shown (spec: the master table ranks units across selected events; points modes). Verify: both files pass and no test still contains 4,608, 11,142, 10,382, 2,885, 1,134 or 603 as an Uthar figure.
- [x] 2.2 Run the whole suite and recompute any other failing figure derived from Uthar's lane base (unit potential, team points, suggestions, upgrade impact, leaderboard, run history), showing the derivation; do not loosen assertions. Verify: `pnpm --filter web test:run` passes and `git diff` of tests shows only Uthar figures changed.
- [x] 2.3 Run `pnpm typecheck`, `pnpm lint` and `pnpm lint:fsd`. Verify: all succeed.

## 3. Verification

- [ ] 3.1 On staging after the API half is deployed, open the master table with Lysander and Uthar in All mode and `votanUthar`'s lane leaderboards. Verify: Dante's Uthar cell reads 5,004 and the row total 11,538 (with Lysander's 6,534), and Uthar Alpha per-battle points use 30 as the base (for example a unit with 65 + 90 objective points reads 185 per battle).
- [x] 3.2 Update `tacticus-planner-docs` only if a document quotes Uthar's old base. Verify: `grep -rn "34 kill\|17 kill" ` over the docs finds nothing stale.

## Workflow follow-up

- Archive with the API half after staging is verified.
- Separate follow-up (not planned here): rename or relabel `killPoints` / "kill points per battle", which is the defeat-all base.
