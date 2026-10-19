## Why

Severyn asked for more mission-specific help on the HRE tab: an Arena team for mission 6 that keeps the Arena tokens mission 10 needs, a Salvage Run team and two 5-slot campaign battles for mission 7, an Onslaught pool of ranged units for mission 9, raid suggestions for mission 10's all-alliance wins, and the goals each raid node feeds, as on the HSE tab.

## What Changes

- The mission team follows a team plan: the lineup rule (now also ranged units, and the featured hero's alliance for alliance ability uses), where it plays (Arena, Salvage Run, Onslaught or campaign battles), its size (8 for Onslaught), a Healer or Mechanic while a heal objective is open, Psychic damage dealers first while a Psychic damage objective is open, and the tokens to keep for a later mission.
- Raid suggestions also serve `winWithAllianceLineup` (raids, with an all-alliance note) and `useAbilitiesAlliance` (battles fought by hand on 5-slot nodes, one per 10 ability uses).
- Each suggested node shows the goal characters it feeds.

## Impact

- `features/hre-missions` (`hre-objectives.ts`, new `hre-team-plan.ts`), `features/daily-raids` (`mission-raids.ts`, `plan-hook-mission-raids.ts`, `hre-raids-section.tsx`, `hre-raids-extras.tsx`), `pages/dailies` (`hre-team-recommendations.ts`, its hook, `hre-team-card.tsx`, `hre-page.tsx`), the `hre` locales and tests.
