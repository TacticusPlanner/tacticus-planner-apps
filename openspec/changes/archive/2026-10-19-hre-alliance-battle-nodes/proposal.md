## Why

Severyn found that "Battles for mission 7" suggested an Indomitus node, where Xenos units cannot deploy, and counted 10 ability uses per battle. A fought battle yields about 5 alliance ability uses (one per unit), so 12 / 20 needs 2 battles, not 1.

## What Changes

- All-alliance battle suggestions (missions 7, 10, 13, 14) list only nodes where the featured hero's alliance can deploy.
- One battle per 5 alliance ability uses still needed.

## Impact

- `features/daily-raids` (`mission-raids.ts`, `plan-hook-mission-raids.ts`, `hre-raids-section.tsx`), `features/hre-missions/model/hre-objectives.ts`, `pages/dailies/ui/hre-page.tsx` and tests.
