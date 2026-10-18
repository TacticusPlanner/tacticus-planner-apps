# Spec Delta

## Purpose

Lets a player preview any battle of a Legendary Event lane before playing it: its map, its waves round by round, and every enemy with its level and stats, ported from V1's LE Battles tab onto V2's lane tabs.

## ADDED Requirements

### Requirement: Each lane tab has a Battles section

Each lane tab SHALL render a **Battles** section for that lane only, after the Synced progress section and before the Eligibility leaderboard. It SHALL list the lane's battles in the order of the lane's catalog `battleIds`, read from the served `lre-battles` dataset. The section SHALL NOT render on Overview. Its heading SHALL carry `data-testid="legendary-event-battles"`.

#### Scenario: Section position on Alpha

- **WHEN** the user opens Lysander's Alpha tab
- **THEN** a Battles section titled "Battles" renders below the Synced progress section and above the Eligibility leaderboard, and offers battles 1 to 18 of Alpha only

#### Scenario: Not on Overview

- **WHEN** the Overview tab is selected
- **THEN** no Battles section renders

### Requirement: One battle is selected per lane, defaulting to the next battle to play

The section SHALL show one selected battle. On first render for a lane the selection SHALL default to that lane's first battle that is not complete in synced progress (complete as defined in `legendary-event-synced-progress`); battle 1 when the lane has no synced progress; the last battle when every battle is complete. The selection SHALL be kept per lane while on the event page, and reset when another event opens.

#### Scenario: Default skips completed battles

- **GIVEN** Lysander's synced Beta lane has battles 1 to 6 complete and battle 7 with only defeat-all cleared
- **WHEN** the user opens the Beta tab
- **THEN** battle 7 is selected

#### Scenario: No synced progress

- **GIVEN** the player-data chunk has no progress for Lysander
- **WHEN** the user opens the Alpha tab
- **THEN** battle 1 is selected

#### Scenario: Every battle complete

- **GIVEN** every Gamma battle is complete
- **WHEN** the user opens the Gamma tab
- **THEN** battle 18 is selected

#### Scenario: Selection kept per lane

- **GIVEN** the user selected Alpha battle 12, then switched to Beta and selected battle 3
- **WHEN** they switch back to Alpha
- **THEN** battle 12 is selected on Alpha, and switching to Beta again shows battle 3

#### Scenario: Reset on another event

- **GIVEN** the user selected Alpha battle 12 on Lysander's page
- **WHEN** they open Uthar's page and its Alpha tab
- **THEN** Uthar's Alpha selection follows the default rule

### Requirement: Desktop and mobile select battles differently

On desktop the selector SHALL show every battle number of the lane as a single-choice control, with the selected one pressed and complete battles marked with accessible text, not colour alone. On mobile it SHALL show previous and next buttons around a "Battle N of M" label, disabled at the first and last battle, and a menu listing every battle to jump to.

#### Scenario: Desktop picks a battle directly

- **WHEN** the page renders at or above 768px and the user presses "9" in Alpha's selector
- **THEN** battle 9 is selected and its preview renders, and battles complete in synced progress expose "complete" to assistive technology

#### Scenario: Mobile steps through battles

- **GIVEN** the page renders below 768px with Alpha battle 1 selected
- **WHEN** the user taps Next twice
- **THEN** the label reads "Battle 3 of 18" and Previous is enabled

#### Scenario: Mobile bounds

- **WHEN** battle 18 is selected below 768px
- **THEN** Next is disabled, and choosing battle 2 from the menu selects battle 2

### Requirement: The battle header shows power and enemy count

The preview SHALL open with the battle number, its served `power` as the enemy power, and the total enemy count: the sum of `count` over every enemy of every wave. Numbers SHALL be formatted for the UI language.

#### Scenario: Lysander Alpha battle 1

- **GIVEN** Lysander Alpha battle 1 has power 994 and six waves whose enemy counts are 7; 3 + 1; 3 + 2; 6; 4; 4 + 2
- **WHEN** it is selected
- **THEN** the header shows "Battle 1", enemy power "994" and "32 enemies" (7 + 4 + 5 + 6 + 4 + 6 = 32)

#### Scenario: Large power is formatted

- **WHEN** Lysander Alpha battle 18 (power 19836420) is selected with the UI in English
- **THEN** the enemy power reads "19,836,420"

### Requirement: Waves are listed in round order with their enemies

The preview SHALL list the battle's waves sorted by `round` ascending, numbered Wave 1 upward, each showing its round, its power and one tile per served enemy entry in served order. A tile SHALL show the NPC's portrait, localized name, a "×N" count when `count` is above 1 and its level. A wave with no enemies SHALL say so.

#### Scenario: First waves of Lysander Alpha battle 1

- **WHEN** Lysander Alpha battle 1 is selected
- **THEN** Wave 1 shows "Round 1", power 147 and one tile "Grot ×7"; Wave 2 shows "Round 3", power 132 and the tiles "Grot ×3" and "Ork Boy" with no count badge

#### Scenario: Empty wave

- **GIVEN** a served wave with an empty `enemies` list
- **WHEN** its battle is selected
- **THEN** the wave renders with its round and power and the text "No enemies in this wave"

### Requirement: An enemy's level is resolved from its served ladder index

An enemy's served `ladderIndex` SHALL be read as a 1-based index into the NPC's served stat ladder, not a star count: its stats are the row at that index minus 1 (row 0 for 0 or less). Its level SHALL show that row's rank and stars as the NPC Library does.

Assumptions:
- Served `ladderIndex` is V1's `"{npcId}:{N}"` index (values reach 56).
- The served ladder is in V1's `NpcService` order.

#### Scenario: Grot in Lysander Alpha battle 1, wave 1

- **GIVEN** the served enemy `{ id: "orksNpc1Grot", ladderIndex: 4, count: 7 }` and Grot's served ladder whose row 3 is rank 2, stars 1, health 69, damage 35, armour 0
- **WHEN** the tile renders
- **THEN** index 4 reads row 4 − 1 = 3, and the tile shows rank Stone III with 1 star, and the enemy detail shows health 69, damage 35 and armour 0

#### Scenario: Same unit at another index

- **GIVEN** the served enemy `{ id: "orksNpc1Grot", ladderIndex: 5, count: 3 }` in Wave 2
- **WHEN** the tile renders
- **THEN** it reads row 4 (rank 3, stars 1) and shows Iron I with 1 star

### Requirement: Unresolved enemies still show

An enemy whose id is not in the served `npcs` dataset, or whose index is past the end of its ladder, SHALL still render a tile with its count, the localized name when the id is known (else the raw id), an initials portrait fallback when no portrait resolves, and the label "Level unknown". It SHALL show no stats and no Library link, and SHALL NOT break the rest of the wave.

#### Scenario: Boss index past the ladder

- **GIVEN** Lysander Beta battle 13's third-round wave serves `{ id: "templBossHelbrecht", ladderIndex: 3, count: 1 }` and Helbrecht's served ladder has 2 rows
- **WHEN** the battle is selected
- **THEN** the wave shows the Initiate and Pyreblaster tiles with their levels and a "Helbrecht" tile labelled "Level unknown", and opening it shows no stats

### Requirement: Tapping an enemy shows its details at that level

Activating an enemy tile SHALL open its details: on desktop in a popover anchored to the tile, on mobile in a bottom sheet. The details SHALL show the portrait, localized name, faction, level, health, damage, armour, melee and ranged attacks and the localized traits of the resolved row. When the NPC is listed in the Library, a link SHALL open its Library page at that variation and level.

#### Scenario: Desktop popover

- **WHEN** at or above 768px the user clicks the "Grot ×7" tile of Lysander Alpha battle 1
- **THEN** a popover shows Grot, Orks, Stone III with 1 star, health 69, damage 35, armour 0, its attacks and traits, and a link to `/library/npcs/grot?variation=orksNpc1Grot&level=3`

#### Scenario: Mobile sheet

- **WHEN** below 768px the user taps the same tile
- **THEN** a bottom sheet shows the same details and link, and closing it returns focus to the tile

#### Scenario: NPC not listed in the Library

- **GIVEN** an enemy whose variation the Library does not list (not `kind` `unit`, or every ladder row all zero)
- **WHEN** its details open
- **THEN** they show its stats and no Library link

### Requirement: The battle map is shown with an unavailable state

The preview SHALL show the battle's map image for its served `mapId`, with alt text naming the battle. On desktop the map SHALL sit beside the waves; on mobile it SHALL be in a "Map" disclosure, collapsed by default, whose open state is kept while on the page. When the map image is missing or fails to load, a "Map not available" placeholder SHALL take its place.

#### Scenario: Desktop map beside the waves

- **WHEN** at or above 768px Lysander Alpha battle 1 (map `LE1_26`) is selected
- **THEN** the `LE1_26` map renders beside the wave list with alt text "Map of Alpha battle 1"

#### Scenario: Mobile map collapsed

- **WHEN** below 768px the same battle is selected
- **THEN** the Map disclosure is collapsed; opening it shows the `LE1_26` map, and it stays open when the user selects battle 2

#### Scenario: Map with no image

- **GIVEN** Fabius Bile's Beta battle 2 serves map `C4_35`, for which no image ships
- **WHEN** it is selected
- **THEN** the "Map not available" placeholder renders and the waves still render

### Requirement: Loading, failure and missing-data states are distinct

While the `lre-battles` read is pending the section SHALL show a skeleton. If it fails it SHALL show an error with a Retry that re-runs the read. When the reads succeed but the lane has no served battles, it SHALL say "No battle data for this lane yet". While `npcs` is pending, tiles SHALL show the raw id and no level.

#### Scenario: Battles pending

- **WHEN** the `lre-battles` read has not settled
- **THEN** the Battles section shows a skeleton and no selector

#### Scenario: Battles failure

- **WHEN** the `lre-battles` read rejects
- **THEN** the section shows the error with Retry, and Retry re-issues the read while the rest of the lane tab keeps rendering

#### Scenario: Lane without battles

- **GIVEN** the catalog lists the event but `lre-battles` holds no battle for its Gamma lane
- **WHEN** the user opens Gamma
- **THEN** the Battles section shows "No battle data for this lane yet" and no selector

### Requirement: Battle preview copy is localized

All Battles section copy (headings, labels, counts, states, map alt text) SHALL be localized in en/de/es/fr. NPC names, factions and traits SHALL be localized by id as the NPC Library does.

#### Scenario: German UI

- **WHEN** the UI language is German and Lysander Alpha battle 1 is selected
- **THEN** the section heading, wave labels, enemy count and map label render in German and the Grot tile shows Grot's German name
