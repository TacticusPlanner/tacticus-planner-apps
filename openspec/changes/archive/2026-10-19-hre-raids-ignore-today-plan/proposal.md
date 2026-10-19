## Why

The HRE raid section counted Today's remaining planned raids toward the mission first. Today's plan is sized to the whole daily energy, so after energy went to raids off the plan it still counted raids that no longer fit, said "Today's plan completes this objective" and suggested nothing. Severyn chose to always ignore Today's plan for HRE suggestions.

## What Changes

- Today's plan no longer counts toward the battles to go and no longer reserves energy or attempts.
- The budget is the daily energy minus the energy really spent today.
- The "battles from today's plan" note and the "Today's plan completes this objective" state are removed; the no-energy state no longer mentions Today's plan.

## Impact

- `apps/web/src/fsd/features/daily-raids/model/mission-raids.ts`, `plan-hook-mission-raids.ts`, `use-daily-raids.ts`, `select-today-raids.ts`, `ui/hre-missions/hre-raids-section.tsx`, their tests and the `hre` locales.
