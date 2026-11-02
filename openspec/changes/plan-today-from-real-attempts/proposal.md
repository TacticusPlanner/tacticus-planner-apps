## Why

Bug report (Discord, after a V1 import): the priority 1 goal (Baldr, 80 energy left) never showed on Dailies > Today, and the Raids Plan never scheduled it. Baldr's material drops at nodes the player had already raided out today. The engine planned day 1 as a fresh day, so it put Baldr's remaining raids on those exhausted nodes; Today then hid them (no attempts left) and the Plan filed them under Day 1's "Raided". Day 2 never got them because the engine thought day 1 finished the goal, so the goal vanished from every surface.

## What Changes

- The farming engine's day 1 caps each node at the player's real attempts left today and spends only the energy left today (`dailyEnergy` minus the real energy spent from synced attempts). Later days are unchanged (fresh attempts, full budget).
- Today, Bonus Raids and the Raids Plan pass the synced attempts left and energy spent into that day 1. A need whose nodes are raided out today moves to tomorrow; Today spends the energy that is left on the nodes that still have attempts, in goal-priority order.
- With no synced attempts, nothing changes (every node fresh, energy spent 0).

## Capabilities

### Modified Capabilities

- `daily-raids-today`: Today's plan is what is left to raid today.
- `daily-raids-plan`: Day 1 starts from today's real attempts and energy.

## Impact

- **Model**: `features/goal-farming/lib/estimate-plan.ts` (`energyUsedToday`, day 1 budget), `features/daily-raids/model/daily-raids-calc.ts`, `use-daily-raids.ts`.
- **Not changed**: the Goals page completion dates (`computePlanInsights`) still plan day 1 fresh; follow-up if they should agree with the Plan when attempts are synced.
- **API**: none.
