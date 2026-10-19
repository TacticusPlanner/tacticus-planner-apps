## Why

Severyn found raid suggestions that ignore the mission's other objective: raids for mission 16 on nodes where Xenos cannot deploy, though the mission also asks for Xenos kills. For mission 11 he asked for a separate list of nodes with Necron enemies, next to the campaign event raids.

## What Changes

- While the mission's other open objective needs alliance units or the featured hero (missions 2, 16, 20, 21), raid suggestions list only nodes where that alliance can deploy, with a note saying so.
- While a faction-kill objective is open (mission 11's Necrons), a separate list shows the cheapest nodes with that faction's enemies, filled with the energy the main list leaves until their enemies cover the kills still needed.

## Impact

- `features/hre-missions/model/hre-objectives.ts`, `features/daily-raids` (`mission-raids.ts`, `plan-hook-mission-raids.ts`, `hre-raids-section.tsx`, `hre-raids-extras.tsx`), `pages/dailies/ui/hre-page.tsx`, `hre.json` locales and tests.
