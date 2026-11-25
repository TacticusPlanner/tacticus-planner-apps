## 1. Guild War group shell

- [ ] 1.1 Pull the API contract and add the `guild-war` dataset to `packages/game-catalog` (storage model, sync, hook).
- [ ] 1.2 Add `entities/guild-war`: API calls and query hooks for the current war, past wars and attacks; rarity cap from zone, slot and level; the stored attack target.
- [ ] 1.3 Add grouped children to the nav model, group labels in the section menu and drawer, and tabs per group; move the guild boundary onto the Guild group's routes.
- [ ] 1.4 Add `/guild/war`, `/guild/war/offense` and `/guild/war/history`, the shared header, Settings (season, battlefield level), the zone and slot selects, the `guild-war` namespace in every locale and the tour.

## 2. Offense page

- [ ] 2.1 Summary strip, offense teams ready and blocked with reasons, available units with search and Filters, all capped at the slot's rarity.
- [ ] 2.2 Selection bar, Log attack dialog with result and Enemy details, attack log with Undo, Start new war.

## 3. History tab

- [ ] 3.1 Past wars newest first, expanding to their attacks, with totals and load more.
