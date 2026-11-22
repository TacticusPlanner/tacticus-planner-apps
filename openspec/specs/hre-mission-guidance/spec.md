# hre-mission-guidance Specification

## Purpose

Helps the player clear HRE missions quickly. Each objective has an 'i' with the game's own hint and a short tip of ours, each mission names the tokens to keep for the next token mission, and the tab compares the tokens the remaining missions need with the tokens the player has now.

## Requirements

### Requirement: Each objective has an 'i' with the game's hint and our tip

Each objective of the current mission SHALL have an 'i' button beside its text. It SHALL open a details overlay (a popover on desktop, a content-height sheet on phones) titled with the objective's text, showing the game's own hint for that objective and then our tip for its kind. An objective with neither SHALL have no 'i'. The expanded mission list SHALL show the same hint and tip under each objective of any other mission. Opening an 'i' SHALL report `hre_objective_info_opened` with the objective kind.

The game's hint SHALL be the localized `MissionQuickLinks/TaskDetails_<key>` text, generated per locale from the datamine into the `hreTaskHints` namespace with English as the fallback. Its first paragraph (the objective restated) SHALL be dropped; a hint of one paragraph drops its first line, or else its first sentence. The key SHALL be the task's served `locaKey` when set, else `<task>_<damage type or faction>_description`, else `<task>_description`, the first that has a text. Placeholders (`{[TARGET_AMOUNT]}`, `{[FACTION_TRAIT]}`, `{[HERO_NAME]}`, `{[FACTION_NAME]}`, `{[DAMAGE_TYPE]}`, `{[GAME_MODE]}`) SHALL be filled with the objective's values, and the game's `<style>` markup SHALL render with its icons. An unknown placeholder SHALL stay as written.

Our tip SHALL say what the game's hint does not: which units or nodes help, never where to play (the folds under each objective say that). Kinds whose game hint already says it (campaign wins, damage type, featured damage, alliance and featured ability uses, summon-free wins, alliance lineups) and the token kinds SHALL have none (Severyn, 2026-11). The tips SHALL include at least:

- campaign raids: every raid counts, so raid the cheapest nodes
- lightning victories: raids count only on campaign event nodes already won as a lightning victory by hand
- kill counts: units with area attacks
- any-unit ability uses: only Characters' abilities count, so Machines of War don't, and Heal and Repair actions don't either

Every kill objective SHALL add a summons tip: summons count as kills; in Arena, pick opponents with summoners; enemy Scarab Swarms copy themselves, and a Biovore or Malleus Rocket Launcher keeps adding summons, so leave them alive and keep defeating the summons (Severyn, 2026-11).

#### Scenario: 'i' on the current mission

- **GIVEN** the current mission is 2 ("Defeat 10 enemies with Chaos units")
- **WHEN** the player opens that objective's 'i'
- **THEN** the overlay shows the game's hint with the target and alliance filled in, the kill tip and the summons tip

#### Scenario: Hint key for a damage type

- **GIVEN** an objective "Deal 7,500 Psychic damage" whose task serves no `locaKey`
- **THEN** its hint is `DealDamageOfProfileType_Psychic_description`, falling back to `DealDamageOfProfileType_description`

#### Scenario: Objective without hint or tip

- **GIVEN** an Arena battles objective whose task has no hint text
- **THEN** it shows no 'i'

### Requirement: Each mission names the tokens to keep for the next token mission

Under the current mission and in each expanded mission, one reserve tip SHALL name the tokens the first later mission with a token objective needs ("Keep 4 Arena tokens for mission 10"). A mission after the last token mission SHALL show none, and a token mission SHALL NOT tell the player to keep the tokens it spends itself.

#### Scenario: Another mission

- **WHEN** the player expands locked mission 8
- **THEN** its objectives show their hints and tips, then "Keep 4 Arena tokens for mission 10"

### Requirement: Tokens needed by remaining missions are compared with synced tokens

For Arena, Guild Raid, Onslaught and Salvage Run, the tab SHALL show the battles that the current mission (less its recorded progress) and all later missions still need of that mode. It SHALL also show the player's current synced tokens for the mode. A mode whose need exceeds the current tokens SHALL be marked "short". A mode with no synced bucket SHALL show "not unlocked". A mode with no remaining need SHALL be hidden. Tokens are compared as a count of battles: one battle uses one token. A preview of the next event SHALL show the card for the whole event (every mission from 1).

Assumptions:

- An `arenaBattles`, `guildRaids`, `onslaught` or `salvageRuns` objective is satisfied by battles of that mode only, and each battle uses one token.
- Token regeneration during the event is not projected. The comparison uses what is available now.

#### Scenario: Worked example on day 1

- **GIVEN** the current mission is 1 and synced tokens Arena 8, Guild Raid 2, Onslaught 3 and Salvage Run 1
- **THEN** the Arena need is 4 + 4 + 4 = 12 (missions 4, 10 and 15) against 8, marked short
- **AND** Guild Raid is 2 (mission 8) against 2, Onslaught is 1 (mission 12) against 3, and Salvage Run is 2 (mission 7) against 1, marked short

#### Scenario: Progress reduces the need

- **GIVEN** the current mission is 10 with 3 / 4 Arena battles
- **THEN** the Arena need is 1 + 4 = 5 (the rest of mission 10, plus mission 15), and Guild Raid and Salvage Run are hidden

#### Scenario: Mode not unlocked

- **GIVEN** the synced Onslaught bucket is null
- **THEN** Onslaught shows a need of 1 and "not unlocked"
