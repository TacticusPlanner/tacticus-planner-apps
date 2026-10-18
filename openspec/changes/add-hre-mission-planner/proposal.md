# Proposal

## Why

Hero Release Events (HREs, the catalog's `new-character-event`) run for 14 days, and their 20 sequential missions (plus a bonus mission) are what most players fall behind on. The hardest are the campaign-count missions: 5, 20, 100, 25, 75 and 250 battles, then 250 more for the bonus. Player guides agree on how to clear them: use the cheapest nodes, because a raid on a 3-energy Indomitus node counts the same as a 10-energy Elite raid. Nothing in the planner tracks HRE missions today, and the HSE tab's farm list ranks nodes by event points, not by battles per energy. Zapspitta's HRE started on 2026-10-18 and is not even in the calendar data.

## What Changes

- New Dailies **HRE** tab at `/dailies/hre`, placed directly after HSE. It shows the running HRE, or the next one as a labelled preview: its featured hero, window and countdown.
- **Mission tracker**: the 21 missions (20 plus the bonus), which are the same in every HRE. They ship with the app, and only the alliance-dependent objectives and the featured-hero objectives change per event. The player picks their current mission and enters the progress on each of its two objectives. This is stored per event instance in local storage. Earlier missions show as done and later ones as locked.
- **Campaign raid suggestions** while the current mission has a campaign objective ("Win N" or "Raid N campaign battles"). Today's remaining planned raids count first, and their energy and attempts are reserved. The suggestions then fill only the leftover energy (daily energy, minus energy spent, minus Today's planned energy) and leftover attempts per node. The list shows where to raid to finish the objective with the least energy. Nodes are ordered by energy cost, cheapest first. Among nodes with the same cost, those that drop something an in-scope goal still needs come first. The list fills up to the attempts left, the energy left today and the battles still needed. It honours the Dailies project selection, the persisted Raids Filters and Planning Settings, like the HSE farm list. It also shows the battles and minimum energy still needed across all remaining campaign missions.
- **Mission guidance**: a short tip per objective type, drawn from community guides. Examples: Indomitus 3-energy nodes for the battle counts; saving 7 to 8 Arena tokens for day 1 and 2 Guild Raid tokens for mission 8; Onslaught and Arena for featured-hero damage. Also a "tokens needed" line comparing the synced Arena, Guild Raid, Onslaught and Salvage Run tokens with what the current and remaining missions need.
- Calendar data fix in `tacticus-planner-api` (data only, no OpenSpec change): add the running Zapspitta HRE (`orksWeirdboy`, 2026-10-18 to 2026-11-01), correct Sekhetar Robot's `featuredCharacterId` to `thousSekhetar`, and set the daily attempt cap of Indomitus I03 to I15 to 3. That cap is to be confirmed in game, and it also affects Today's planning.

## Capabilities

### New Capabilities

- `hre-mission-tracker`: which HRE instance the tab shows, the fixed mission list worded by alliance and the player's locally stored mission progress.
- `hre-campaign-raids`: the least-energy raid suggestions for the current mission's campaign objective, and the remaining-campaign-battles summary.
- `hre-mission-guidance`: tips per objective type and the tokens-needed comparison against synced tokens.

### Modified Capabilities

- `dailies-navigation`: adds the HRE tab after HSE, so the primary tabs become Raids, HSE, HRE, Shops, Guild Raids.

## Impact

- `apps/web`: a new `features/hre-missions` slice (model and UI), `pages/dailies/ui/hre-page.tsx` with its tutorial, the dailies route, nav items and the tutorial registry. It reuses `daily-raids` eligibility, attempts left, today's energy, Raids Filters and goal-farming need allocation through their public APIs.
- `apps/web/public/locales/*`: a new `hre` namespace in every supported locale (en, de, es, fr), with mission objective templates, tips and tour steps.
- `tacticus-planner-api`: two edits in `event-occurrences.json`.
- No sync or backend storage. Mission progress stays in the browser and is not shared across devices.
