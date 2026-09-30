## 1. Confirm V1's yield definition

- [x] 1.1 Read V1's `energyPerDay` / `energyPerItem` derivation for a location and `calculateDaysToCompleteMaterial`, and record the exact per-node items-per-day formula in a code comment; verify it matches design Decision 2 (adjust the formula if V1's differs)

## 2. Engine

- [x] 2.1 Add a `dailyEnergy` parameter to `spendDay` and pass it from `estimateGoal` and `estimatePlan`; verify existing call sites compile (`pnpm typecheck`)
- [x] 2.2 Replace the (material, node) energy-cost sort in `spendDay` with materials ordered by descending time to finish, spending each material's nodes in existing node order; verify with unit tests: capped bottleneck before cheap material, equal times keep existing order, zero-yield material sorts first, cross-goal order and shared attempt caps unchanged
- [x] 2.3 Add a Neurothrope-like fixture test (cheap uncapped materials plus capped expensive ones at 538 energy/day) asserting bottleneck-first completes in fewer days than cheapest-first would

## 3. Consumers

- [x] 3.1 Run `pnpm test:run` and update expectations in engine, daily-raids and page tests whose completion days or per-day entries changed; verify each change is explained by the new ordering, not a regression

## 4. Live comparison (Aspire, signed-in account)

- [x] 4.1 With the same daily energy and "By goals priority" in both apps, compare Neurothrope's days, energy and Day 1/Day 2 upgrade lists in V2 Raids Plan against V1; record the remaining differences and their likely cause (rounding, node tie-break, campaign progress)

## 5. Final checks

- [x] 5.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all pass

Live result (538 energy/day, both "By goals priority", duplicate Arjac goal removed): plan totals V2 50 days / 26,250 energy vs V1 49 days / 25,896 (was V2 56 days before this change). Done-by (V1 → V2): Neurothrope 3d → 4d, Arjac 4d → 4d, Z'Kar 5d → 5d, Ragnar 6d → 7d, Ahriman 13d → 15d, Abraxas 23d → 37d, Re'vas 23d → 28d, Yarrick 25d → 26d, Incisus 26d → 30d. Per-goal energy is within ~1-7% for most goals (Neurothrope 1,414/1,408, Arjac 455/461, Z'Kar 552/576) except Ragnar (694 vs 940). Day 1 now includes V1's Psyk-Conductive Material, Psychic Force Conduit and Mutation: Warped Heart cells. Remaining gaps to investigate separately: Neurothrope +1 day, Ragnar +246 energy, and late goals (notably Abraxas +14 days) finishing later in V2.
