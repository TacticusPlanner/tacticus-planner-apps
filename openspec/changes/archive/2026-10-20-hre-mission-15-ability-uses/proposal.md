## Why

Severyn asked for mission 15 (4 Arena battles, 150 ability uses) to suggest Arena teams, Onslaught teams and campaign raids on 5-slot nodes, with the running HSE taken into account.

## What Changes

- Mission 15's ability uses get raid suggestions on 5-slot nodes, 5 uses per raid. The running HSE ranks them as it does other HRE raids.
- Mission 15 gets an Arena team (while its Arena battles are open) and an Onslaught pool of 8, both from the strongest units.
- Mission 3's ability uses get the same Onslaught pool, and 5-slot raids once its campaign wins are done.
- `selectTeamPlan` becomes `selectTeamPlans`, and the HRE tab shows one team card per plan.

## Capabilities

### Modified Capabilities

- `hre-campaign-raids`: 5-slot raids for any-unit ability uses.
- `hre-mission-teams`: Arena and Onslaught teams for any-unit ability uses.

## Impact

- `features/hre-missions`: `hre-objectives.ts`, `hre-team-plan.ts`.
- `features/daily-raids`: the HRE raids note.
- `pages/dailies`: the team hook, card and page, and the `hre` locales.
