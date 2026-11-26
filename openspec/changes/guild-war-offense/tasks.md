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

## 6. Third feedback round

- [x] 6.1 Every Guild War phase on Home opens Offense, preparation too.
- [x] 6.2 The first war's preparation opens 48 hours early (`firstWarPreparationBonusHours`), so Home shows it live as in the game.
- [x] 6.3 Filters: the shared Filters control in form size, with Owned only and Show deployed as switches at the top; the badge counts Owned only.
- [x] 6.4 Deployed units show, with Show deployed, in a Deployed section below a divider, dimmed and flagged with their zone.
- [x] 6.5 The first 30 characters show on desktop and 12 on phones, then Show all (N); a search or filter shows every match; MoWs always show in full.
- [x] 6.6 At most 5 characters and 1 MoW: once a kind is full its other tiles are blocked with a tooltip.
- [x] 6.7 The selection bar shows the picked units with the Teams page's under-cap and capped-down marks, the reason in a hint.
- [x] 6.8 An amber "No Machine of War · N available" reminder scrolls to the MoW list without blocking the log.
- [x] 6.9 The battlefield level is a select in the toolbar beside Zone; the Settings sheet is removed and an unlisted season shows in a banner.
- [x] 6.10 Start new war clears the level and zone; logging needs both; local storage keeps them for the current war only.
- [x] 6.11 Attack log (N) in the summary scrolls to the log.
- [x] 6.12 Log with details starts as Won, the result options carry trophy and skull icons, and the lost-units rows stay for every result.
- [x] 6.13 The enemy map is picked by its board picture from the season's map pool.

## 7. Eighth feedback round

- [x] 7.1 A blocked team names every deployed core unit (three, then "and N more"), and its deployed portraits are dimmed.
- [x] 7.2 The expanded characters list has Show less; a team's Select expands the list when it picks a character.
- [x] 7.3 Each map in the map picker opens large (1080 px board art) with previous, next and Pick this map.
- [x] 7.4 The zone's own buff starts ticked; the buff list offers it, the ticked buffs and the non-Local buffs given by other zones.
- [x] 7.5 Enemy rarity and rank options stop at the defenders' cap.
- [x] 7.6 The Log attack dialog changes the zone and rarity, for new attacks and edits; for a new attack the toolbar follows.
- [x] 7.7 One under-cap chip and one over-cap chip by rank (rank at or below the previous rarity's rank cap, or at or above the next one's) replace the per-portrait marks.
- [x] 7.8 MoW portraits show the generic MoW icon where characters show their rank beside them.
- [x] 7.9 Offense team cards show flex units after a divider; Select picks the core, then the flex units not deployed while the attack has room; only a core unit blocks a team.
- [x] 7.10 All teams on Offense opens the Teams page; the Teams page's War Offense section opens Guild War Offense.
