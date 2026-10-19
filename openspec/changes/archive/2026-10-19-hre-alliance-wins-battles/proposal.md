## Why

A review of #249 found that mission 10 and 14 suggested raids for "win N battles with an all-alliance team". Raids have no lineup, so they cannot count toward that objective. It also noted that the mission 7 battles ignore the ability uses of the Salvage Runs, and that the Onslaught card named the requested pool size, not the units it actually holds.

## What Changes

- All-alliance wins are suggested as battles fought by hand ("Battles for mission N"), on nodes of any slot count, with a note that raids do not count and Arena wins with the same team do.
- The mission 7 battle note says ability uses in Salvage Runs and other modes count too.
- The Onslaught card counts the units it holds, and says there are no spares when fewer than 5 qualify.
- Spec scenarios cover the ranged Arena team of mission 4.

## Impact

- `features/hre-missions/model/hre-objectives.ts`, `features/daily-raids/ui/hre-missions/hre-raids-section.tsx`, `pages/dailies/ui/hre/hre-team-card.tsx`, the `hre` locales and tests.
