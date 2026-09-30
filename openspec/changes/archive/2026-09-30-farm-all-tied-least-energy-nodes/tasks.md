## 1. Engine

- [x] 1.1 In `selectFarmNodes`, compare `energyCost / dropRate` rounded to two decimals (as V1 does) when finding the minimum and the tied set, keeping each node's real `dropRate`; verify with a unit test that efficiencies 33.331 and 33.334 tie and 33.33 vs 33.34 do not
- [x] 1.2 Replace the "narrow to the highest `expectedGold`" step with a stable sort of the tied nodes by `expectedGold` descending (null/absent last), returning every tied node; leave the restricted-locations path unchanged; verify with unit tests: both tied nodes returned, higher gold first, node with no gold last but present, equal gold keeps existing order, a strictly more efficient node still excludes a higher-gold one, restricted set returned as chosen
- [x] 1.3 Replace the old "expectedGold tie-break" tests in `estimate.test.ts` that assert single-node selection with tests for the new behavior; verify the file passes

## 2. Spend behavior

- [x] 2.1 Add a `spendDay`/`estimateGoal` test where a material has two tied nodes with 6-raid caps: both are raided the same day (higher-gold first) and the material's day-1 yield doubles versus one node
- [x] 2.2 Add a Neurothrope-like fixture test (a material with two tied nodes plus other capped materials at 538 energy/day) asserting the goal completes in fewer days than with a single node

## 3. Consumers

- [x] 3.1 Run the goal-farming, daily-raids and goals-page tests; update expectations that changed only because extra tied nodes now contribute, and confirm `plan-bottlenecks` and `use-progression-preview` still behave sensibly (no test regression unexplained by the new selection)

## 4. Live comparison (Aspire, signed-in account)

- [x] 4.1 With the same daily energy and "By goals priority" in both apps, compare Psyk-Conductive Material and Psychic Force Conduit nodes and Day 1 yield for Neurothrope in V2 Raids Plan against V1 (expect two nodes each and Psyk-Conductive 8 → about 13 on Day 1); record remaining differences and their likely cause

## 5. Final checks

- [x] 5.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all pass

Live result (538 energy/day, both "By goals priority"): V2 Neurothrope Day 1 now raids Psyk-Conductive Material at Fall of Cadia ME 38 and ME 7 (6 raids each) as V1 does, and Sophisticated Material moved to Day 1 like V1; Psychic Force Conduit uses ME 39 + ME 15 (V1: Day 1, V2: Day 2). Day ranges (V1 → V2): Neurothrope 1-3 → 1-3, Z'Kar 4-5 → 4-5, Abaddon 33-35 → 33-35, Abraxas 12-23 → 11-22, Re'vas 20-23 → 19-22, Ahriman 6-13 → 4-11, Incisus 24-26 → 8-26, Shiron 26-33 → 20-33, Arjac 3-4 → 1-4. Plan totals 49 → 50 days. Remaining gaps: Ragnar is still absent from V2's plan (PLAN-014, blocked-goal handling, separate change); V2 starts lower-priority goals (Arjac, Incisus, Shiron) earlier than V1; Advanced Filaments is on Day 1 in V2 but Day 2 in V1.
