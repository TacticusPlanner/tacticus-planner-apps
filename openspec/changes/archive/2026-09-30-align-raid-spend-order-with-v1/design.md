## Context

`spendDay` (`goal-farming/lib/estimate.ts`) builds `spendable` as every (material, node) pair for the goal's remaining materials and sorts it by `node.energyCost` ascending. `estimatePlan` calls it once per goal per day in global priority order, sharing one `attemptsUsedByBattle` map; `estimateGoal` calls it directly for the isolated estimate.

V1 (`tacticusplanner/.../upgrades.service.ts`): `tagLocationsWithGoalPriorityAndDaysToCompletion` tags every location with the priority of the highest goal needing the material and `daysToComplete` (`calculateDaysToCompleteMaterial`: remaining ÷ Σ `loc.energyPerDay / loc.energyPerItem` over suggested locations); `sortLocationsForRaiding` sorts by priority ascending, then `daysToComplete` descending.

Observed with the same account, 538 energy per day: V1 Neurothrope 1,414 energy / 3 days; V2 1,408 energy / 5 days. Root cause read from source (unconfirmed against runtime data): V2 spends cheap nodes first and leaves capped bottleneck materials for later days.

## Goals / Non-Goals

**Goals:**

- Within a goal's turn, order work the way V1 does, so completion days and Day 1 lists move toward V1's.

**Non-Goals:**

- V1's energy rounding, node tie-break, campaign-progress source, "By total materials" and home-screen-event ordering.
- Changing cross-goal order, cap sharing, inventory allocation or node selection.

## Decisions

### 1. Order materials, not (material, node) pairs

`spendDay` computes a time to finish per remaining material and sorts materials descending (stable), then spends each material's nodes in the order `nodesById` already gives (the `selectFarmNodes` order). This mirrors V1 where all locations of one material share one `daysToComplete` and one priority. Since `spendDay` runs per goal, V1's "priority of highest goal needing the material" is already implied by the goal loop; only the `daysToComplete` key is new.

Alternative: keep the pair sort and add a secondary key. Rejected — cost would still dominate and reproduce the bug.

### 2. Time to finish

`remaining / Σ_nodes itemsPerDay(node)`, with `itemsPerDay = dropRate × min(floor(dailyEnergy / energyCost), dailyAttempts > 0 ? dailyAttempts : ∞)`. A material with zero yield sorts as longest (Infinity). `spendDay` needs the daily energy budget: pass it as a new parameter (`dailyEnergy`), supplied by both callers (`estimateGoal`, `estimatePlan`), not derived from `startingEnergy`, which shrinks as higher-priority goals spend. Confirmed against V1: `calculateDaysToCompleteMaterial` uses only the attempt cap (`energyPerDay = dailyBattleCount × energyCost`, `campaigns.service.ts:134-160`, so items/day ≈ `dropRate × dailyBattleCount`). V2 deliberately also bounds by the daily energy budget, so ordering can still differ from V1 for cheap high-cap nodes.

### 3. Compute once per call, not per pass

Ordering is computed at the start of each `spendDay` call from that moment's `remaining`, since remaining counts change day to day (V1 recomputes per day too).

## Risks / Trade-offs

- [Behavior change ripples into many tests and screens] → Update expectations deliberately; add a Neurothrope-like fixture asserting fewer days; compare live against V1 afterward.
- [Even with this ordering V1 and V2 still differ by rounding and node tie-breaks] → Stated non-goals; verify the remaining gap after this change and open follow-ups only if needed.
- [The existing spec says V1's per-material budget model intentionally differs] → That sentence concerns budgeting across goals, which this change leaves alone; only the within-goal order moves toward V1.

## Migration Plan

Engine-only, V2 pre-production: ship directly; rollback is a revert.
