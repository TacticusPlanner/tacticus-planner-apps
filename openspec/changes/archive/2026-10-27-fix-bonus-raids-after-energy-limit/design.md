# Design

## Context

Today computes three day-1 schedules from one `EstimatePlanParams`: the real schedule (`estimateTodayRun`), Bonus Raids (`estimateBonusRaids`: unlimited energy minus every material the real run raided) and the multi-day Plan. `selectTodayRaids` (shared by Dailies > Today and the Home raids widget) drops the plan once the synced energy spent today reaches `planningSettings.dailyEnergy` and shows Bonus Raids alone. Real attempts left per node (`attemptsLeftByBattle`, from `live-progress.battleAttempts`) only hide exhausted nodes; the engine never reads them.

## Goals / Non-Goals

**Goals:**

- After the limit, Bonus Raids show everything still worth raiding today, top goal first.
- Raids after the limit never exceed a node's real attempts left.

**Non-Goals:**

- Changing Today's plan, below-limit Bonus Raids, the Raids Plan, Goals estimates or the HSE/HRE tabs.
- Reducing the real schedule by the energy already spent (the plan is hidden after the limit anyway).

## Decisions

1. **A separate "raids left today" schedule, not a patched bonus list.** `estimateRaidsLeftToday` runs the one-day engine at unlimited energy with `attemptsLeftByBattle`. Subtracting real-run raids from the unlimited run was considered, but the real run assumes a fresh day and full energy, which no longer matches what the player can do once the energy is spent. One more one-day run per calculation is cheap next to the multi-day Plan.
2. **Attempts left cap the node inside `spendDay`.** The cap becomes `min(daily cap, attempts left)` and is shared across goals and materials at that node, like the daily cap. It applies to day 1 only, since later days start fresh. The entry reports the lowered cap as its `dailyAttempts`, so `plannedRaidNeed` reads "the attempts left" where it read "a full day of attempts" and shows no label when the player can only raid the node out. Unknown data (no entry in the map) keeps the full cap, matching how exhausted-node hiding treats unknown data.
3. **Selection stays in `selectTodayRaids`.** The calculation returns both `bonus` and `raidsLeftToday`; `selectTodayRaids` picks `raidsLeftToday` once the limit is reached and keeps the exhausted-node filter for both. Today and the Home widget therefore stay in step through one function, as before.

The FSD owner is unchanged: the engine lives in `features/goal-farming` and reaches `features/daily-raids` through its `@x/daily-raids` public API.

## Risks / Trade-offs

- The real schedule (and so the header totals) still assumes a full day after the limit. That is the existing, specified behavior.
- An extra one-day engine run per calculation. Bonus Raids already run two, and the run is bounded by today's needs.

## Migration Plan

None. Client-only, no stored data.
