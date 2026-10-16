# Tasks

All paths are under `apps/web/src/fsd` unless stated. Commands run from the repository root (`pnpm --filter web exec vitest run <file>` for one file).

## 1. Earned points in the progress reader

- [x] 1.1 In `entities/legendary-event/lib/synced-lane-progress.ts` add `killScore` (the encounter's `encounterPoints`, capped at the battle's `battlePoints`) and cap `highScore` the same way on `BattleProgressView`; set `pointsEarned = killScore + highScore + cleared scores`; update the doc comments (spec: synced lane data maps onto battles and objectives). Verify: `synced-lane-progress.test.ts` passes with new cases for the three spec scenarios (partial battle 31 + 31 + 32 + 95 + 80 = 269 of 471, complete battle 481 equal to its maximum, Uthar Alpha battle 1 = 298 of 463).
- [x] 1.2 Add a test that a lane built from `votanUthar`'s catalog lanes and the per-lane figures of the spec (high scores summing to 506, 551, 441; cleared scores 3,125, 3,607, 3,411) reads 4,137, 4,709, 4,293, which sum to 13,139. Verify: the test passes, and a fixture assertion shows `pointsEarned` never exceeds a battle's maximum.
- [x] 1.3 Update `lane-points-model.ts` comments so the "kill score + high score" maximum and the earned rule read as one model. Verify: `lane-points-model.test.ts` still passes unchanged.

## 2. Reachable points, upgrade impact and team suggestions

- [x] 2.1 In `entities/legendary-event/lib/reachable-points.ts` read `killScore` and `highScore` from the progress view and add both unearned parts per reached battle (spec: lane reachable points). Verify: `reachable-points.test.ts` asserts 620 for the Four team, 1,201 and the per-battle figures 65, 140, 240, 248, 252, 256 for the overlapping-teams case.
- [x] 2.2 Recompute the upgrade-impact figures in `upgrade-impact.test.ts` and `legendary-event-upgrade-impact` page tests (gain +191 for four rows, stored-depth case 433 before and +187, header "best +191"). Verify: the affected tests pass with the spec's figures and no figure from the old spec (505, 148, 146, 359) remains in the suite.
- [x] 2.3 Recompute `team-suggestions.test.ts` and `features/legendary-event-team-suggestions` dialog tests: gains 811, 870, 945, 865, 893, ranking Melee +945, Incisus and Calgar +893, Max 2 Hits +870, Incisus alone +865, Ultramarines +811; after saving the Melee team +420, +250, +200, +191; the dialog reason line "+945". Verify: tests pass; `grep -rnE "830|819|755|653" features/legendary-event-team-suggestions entities/legendary-event` shows no stale figure.

## 3. Token plan

- [x] 3.1 In `features/legendary-event-tokens/lib/token-plan.ts` replace the single `highScore` array of a lane's state with `killScore[]` and `highScore[]` initialised from the progress view; value a winning token with both unearned parts; set both to `battlePoints` after a planned token; compute the earned total with both (spec: token plan from synced progress). Verify: `token-plan.test.ts` asserts the worked Uthar plan (+240, +248, +252, +191, +140, +65, running 5,240, 5,488, 5,740, 5,931, 6,071, 6,136; 1,136 points) and the Stop here case (445 points).
- [x] 3.2 Update `token-plan.fixtures.ts` (encounters carry `encounterPoints` equal to `highScore`) and the downstream tests that use them: `token-plan-view.test.ts`, `run-forecast.test.ts` inputs, the Next token card (+240) and the token plan list (milestone 13 at token 3 and milestone 14 at token 5). Verify: those suites pass.
- [x] 3.3 Fix `token-plan.v1-parity.test.ts`: give each V1 lane `battlesPoints` as one award (not the V1 sum) with `maxPoints = 2 × battlePoints + …`, remove the "design D3 a" deviation comment and add the Fabius Bile case from the spec (55 tokens, 8,615 points, first-pass values 249 … 269, 242 … 270, 238 … 258, then 204 and 203, then the 35 second-pass tokens), using the catalog values of `lostaBile` in a fixture. Verify: the parity suite passes, including that every V1 case now matches without a deviation.

## 4. Run forecast and run history

- [x] 4.1 Recompute the worked forecast in `run-forecast.test.ts` (run 2: 1,136 points to 6,136, milestones 13 and 14 for 295 currency, chest 11 opened, 11 chests, 275 shards, 125 missing; run 3: 585 in hand, chests 12 and 13, 13 chests, 325 shards, 75 missing with the 8,000 blackstone hint; header "By the end of run 3: 6,136 points · Unlock 75 shards short"). Verify: forecast and Overview page tests pass; the leftover line stays "94 tokens with nothing to play".
- [x] 4.2 In `entities/legendary-event/lib/run-history.ts` build the synced-lane shape from a record with `encounterPoints = highScore`. Verify: `run-history.test.ts` asserts the Uthar run 1 lane points 463, 322, 165, 165, 24 and total 1,139, and the Last run card test reads "Alpha: battle 4 · 1,139 points".

## 5. Copy

- [x] 5.1 Update `progress.howPoints.body` in `public/locales/{en,de,es,fr}/legendaryEvents.json` so it says earned points are the kill score plus the high score plus the defeat-all bonus and the cleared objective scores, with real de, es and fr translations at the quality of the surrounding keys. Verify: all four locale files carry the changed key and the web test suite passes with the progress grid disclosure test reading the new text.
- [x] 5.2 Check the lane overview disclosure (`lane.howPoints.body`) for any statement that contradicts the two-award rule; leave it unchanged when it does not. Verify: a note in the PR names the decision.

## 6. Verification and documentation

- [x] 6.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm test:run`. Verify: all four succeed.
- [ ] 6.2 On the deployed staging site at 1280px and in a same-origin 420px frame, open `votanUthar` and `lostaBile`: the Uthar lane headers read 4,137 / 4,709 / 4,293; Alpha battle 1 reads 298 / 463; the Fabius token plan reads 55 tokens and +8,615 points with Alpha battle 1 first at +249; the Uthar Run forecast header reads "By the end of run 3: …" with the figures above for the account's synced state. Record the figures in the PR. Verify: each figure matches V1 on the same account.
- [x] 6.3 In `tacticus-planner-docs`, update the Legendary Event feature spec and the plan's risk entry on `encounterPoints` so they state the two-award rule and the 2026-10-16 evidence. Verify: the docs build or lint passes and the entry no longer says the semantics are unverified.

## Workflow follow-up

- Archive the change after the release is verified on staging.
- Open the separate API change for the `votanUthar` `killPoints` mismatch (34 / 26 / 17 against `defeatAll` 30 / 34 / 43) found during this validation; it is not part of this change.
