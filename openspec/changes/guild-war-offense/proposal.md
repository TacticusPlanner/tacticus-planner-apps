## Why

V1's Guild War Offense page lets a player mark units as deployed during a war so they can see which offense teams are still usable. V2 has the teams (`personal-teams`) and the roster but no Guild War page. The plan ("Guild War Offense V2 plan", rows 1 to 6 and 24 Agreed) brings it to V2 as an attack log: log each attack in one tap with its zone, slot and lineup, cap the lineup at the slot's rarity, undo a mistap, and keep every war as history.

Companion change: `guild-war-offense` in `tacticus-planner-api`, which applies first (the `guild-war` dataset and the `/api/v1/guild-wars` endpoints).

## What Changes

- A **Guild War** group in the Guild section with two sign-in-only tabs that do not need a registered guild: **Offense** at `/guild/war/offense` and **History** at `/guild/war/history`. `/guild/war` redirects to Offense. The guild access boundary moves from the whole section onto the Guild group's routes (Members, Settings).
- The Guild submenu splits into two labelled groups, Guild and Guild War, on the desktop section menu and the phone drawer. Page tabs under the header show only the current group.
- The zone and slot being attacked are a toolbar pair above the tabs. The last picked values are kept on the device (local storage), not in the URL. Together with the war's battlefield level they set the rarity cap that every portrait on the page is shown at.
- **Offense**: a summary strip (tokens used of the season's attempts, units left per rarity, attacks logged), offense teams ready first then blocked with the reason, available units with search and filters, a contextual selection bar with Log attack, a Log attack dialog with an optional result and optional Enemy details, the attack log with Undo, Start new war behind a confirmation, and a Settings dialog for the season and battlefield level.
- **History**: past wars newest first, each expanding in place to its attacks, plus totals (win rate by zone tier and slot rarity, most used lineups).
- A `guildWar` i18n namespace in every locale (plus the game's zone, tier and buff names), a tour, and the `guild-war` catalog dataset in the game-catalog package.

## Capabilities

### New Capabilities

- `guild-war-offense`: the Guild War pages, the attack target, the Offense tracker, Log attack, Undo, Start new war and History.

### Modified Capabilities

- `app-navigation`: the Guild section gains a Guild War group and grouped submenus; the guild boundary covers only the Guild group.

## Impact

- `packages/game-catalog`: the `guild-war` dataset, its storage model and hook.
- New `pages/guild-war`, holding its war API, queries, rarity cap and derived state (no other slice reads them).
- `pages/guild` (boundary moves to its own routes), `app/routes`, `app/layout/nav-items.ts` and the section menu, drawer and tabs.
- `shared/api/schema.d.ts`, regenerated from the API contract.
- A new `guildWar` i18n namespace and nav keys in `common.json`.
