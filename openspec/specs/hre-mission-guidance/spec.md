# hre-mission-guidance Specification

## Purpose

Helps the player clear HRE missions quickly. It gives a short strategy tip for each objective type and the tokens to keep for the next token mission, and compares the tokens the remaining missions need with the tokens the player has now.

## Requirements

### Requirement: Each objective type has a localized strategy tip

Every objective kind the app knows, except the token kinds (`arenaBattles`, `guildRaids`, `onslaught`, `salvageRuns`), SHALL have one short localized tip. A tip SHALL say which units or play help with the objective, never where to play it: the campaign list and the team cards say that. Tips SHALL be shown under the current mission's objectives. On any other mission, they SHALL be shown on demand by expanding that mission. An unknown objective kind SHALL show no tip. The tips are static copy, not computed. They SHALL include at least:

- campaign wins: raids count as wins, and so does every battle won by hand
- campaign raids: every raid counts, so raid the cheapest nodes
- kill counts: units with area attacks
- summon-free wins: leave summoners out of the team
- all-alliance lineups: field only units of the event's alliance
- any-unit ability uses: use every unit's active ability each battle; Machines of War don't count

After the tips, each mission SHALL show one reserve tip naming the tokens the first later mission with a token objective needs ("Keep 4 Arena tokens for mission 10"). A mission after the last token mission SHALL show none, and a token mission SHALL NOT tell the player to keep the tokens it spends itself. Severyn chose strategy-only tips (2026-10).

#### Scenario: Tip on the current mission

- **GIVEN** the current mission is 20 ("Use abilities 10 times with Zapspitta" and "Win 250 campaign battles")
- **THEN** the featured-hero ability tip and the campaign-win tip are shown under its objectives, with no reserve tip

#### Scenario: Tip on another mission

- **WHEN** the player expands locked mission 8
- **THEN** the damage tip is shown, then "Keep 4 Arena tokens for mission 10"; the Guild Raid objective has no tip

### Requirement: Tokens needed by remaining missions are compared with synced tokens

For Arena, Guild Raid, Onslaught and Salvage Run, the tab SHALL show the battles that the current mission (less its recorded progress) and all later missions still need of that mode. It SHALL also show the player's current synced tokens for the mode. A mode whose need exceeds the current tokens SHALL be marked "short". A mode with no synced bucket SHALL show "not unlocked". A mode with no remaining need SHALL be hidden. Tokens are compared as a count of battles: one battle uses one token.

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
