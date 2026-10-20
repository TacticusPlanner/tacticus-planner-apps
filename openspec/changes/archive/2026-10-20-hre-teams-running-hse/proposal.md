## Why

Severyn noticed that the HRE Arena and Onslaught team suggestions ignore a Home Screen Event running at the same time (Psyker Boost), so the player cannot progress in both events with one team.

## What Changes

- While a personal HSE runs, its scoring units lead the HRE mission teams for the token modes it scores in (Arena, Onslaught, Salvage Run), after the mission's own rule and preferences.
- An Onslaught or Salvage Run track goes to the alliance with the most of the HSE's units, then the most units.
- The team card says how many of its units also score for the HSE, or that none do.

## Capabilities

### Modified Capabilities

- `hre-mission-teams`: HRE teams take a running HSE into account.

## Impact

- `pages/dailies`: `hre-team-recommendations.ts`, `hse-team-recommendations.ts` (`hseEventUnitPools`), the new `use-running-hse.ts`, the team hook, card and page, and the `hre` locales.
