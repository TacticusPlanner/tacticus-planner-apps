## 1. Guild War group shell

- [x] 1.1 Pull the API contract and add the `guild-war` dataset to `packages/game-catalog` (schema, storage model, sync) and the game's zone, tier and buff names.
- [x] 1.2 Add the war API calls and query hooks (current war, past wars, attacks), the rarity cap from zone, slot and level, and the stored attack target in `pages/guild-war` (only its pages read them).
- [x] 1.3 Add grouped children to the nav model, group labels in the section menu and drawer, and tabs per group; move the guild boundary onto the Guild group's routes.
- [x] 1.4 Add `/guild/war`, `/guild/war/offense` and `/guild/war/history`, the shared header, Settings (season, battlefield level), the zone and slot selects, the `guildWar` namespace in every locale and the tour.

## 2. Offense page

- [x] 2.1 Summary strip, offense teams ready and blocked with reasons, available units with search and Filters, all capped at the slot's rarity.
- [x] 2.2 Selection bar, Log attack dialog with result and Enemy details, attack log with Undo, Start new war.

## 3. History tab

- [x] 3.1 Past wars newest first, expanding to their attacks, with totals and load more.

## 4. Feedback

- [x] 4.1 Move the zone and rarity into Log attack (last zone remembered, rarity instead of slot, units at their own progression on the page), and open Settings from the season and level line.
- [x] 4.2 Record lost units by tapping them and a 200-character note; show the zone picture, lost units, enemy units and buffs, and the note in each attack.
- [x] 4.3 Default the season from the calendar's `seasonConfigId`, keep a war's season once it has attacks, and send `currentWarId` when starting a war.
- [x] 4.4 Game pictures for zones, buff badges and the Guild War token; History totals by zone, characters, lineup win rates, enemies lost to and overall counts.
- [x] 4.5 One Zone choice per zone kind (no copy numbers), seasons by their calendar number shown read-only in Settings, Start new war in the calendar's season, and New team with War Offense picked.

## 5. Second feedback round

- [x] 5.1 Zone and defenders' rarity in the toolbar (kept per device, rarity defaulting to the zone's highest cap), capping units and teams; Start new war as the toolbar action.
- [x] 5.2 Won and Lost in the selection bar log at once; Log with details opens the dialog with the target read-only.
- [x] 5.3 Edit (with the attack's revision, also for ended wars in History) and Delete with a confirm, replacing Undo.
- [x] 5.4 Enemy details: no clipping, new enemies at the defenders' rarity, highest rank and Killed, icons on rarity, rank and outcome, buffs explained in the game's words.
- [x] 5.5 No battlefield level 0, new wars at level 1, plain season and level line, style-guide fixes from the review.
- [x] 5.6 Home shows the running Guild War phase in Right now and the next one in Upcoming events; a war phase opens Offense, a preparation phase opens nothing until Defense exists.
