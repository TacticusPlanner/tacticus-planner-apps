## MODIFIED Requirements

### Requirement: Relic panel

For a character that a relic can be equipped on (a catalog relic whose allowed units include it), the
Details tab SHALL show a Relic panel with the relic's icon in a rarity-coloured frame, its name, and a
level stepper from 1 to 10 starting at the player's equipped relic level, else 1. When the relic has
rules text in V2's game text, the panel SHALL show it at the stepper's level with a next-level line and
a chart whose y axis starts near the lowest value; otherwise it SHALL show the missing-text note with no
stepper and no chart. The panel's label SHALL say whether the relic is unique or shared, from the
catalog's unique-relic flag: "Unique relic", or "Shared relic" with a line naming the other characters
that can equip it ("Also equippable by …"). Characters without a relic SHALL still show the Relic card,
naming the character ("<name> has no relic.") with no stepper or chart; on mobile its section starts
collapsed with the summary "None".

Assumptions:

- 32 of the 35 catalog relics have rules text (see the `ability-rules-text` capability); `Fidelity`,
  `LionHelmRelic` and `Thrydderghyre` have none in any source.
- Relic rules-text values are not scaled by rarity unless V1 marks them as rarity-affected.

#### Scenario: Relic slot is marked

- **WHEN** a visitor opens Maugan Ra, whose relic Maugetar is a Crit relic
- **THEN** At a glance marks his Crit slot "Relic: Maugetar" and no other slot

#### Scenario: Equippable items for a slot

- **WHEN** a visitor opens Maugan Ra and expands his Crit slot
- **THEN** it lists 12 items grouped Mythic down to Common, the Shuriken Pistol and Ceremonial Knife lines,
  and no item of another faction or without a real name

#### Scenario: Relic name jumps to the Relic panel

- **WHEN** a visitor activates "Relic: Maugetar" in Maugan Ra's Crit slot
- **THEN** the Relic panel scrolls into view and has focus; on mobile the Relic section opens first

#### Scenario: Unique relic

- **WHEN** a visitor opens Maugan Ra, whose relic Maugetar is unique to him
- **THEN** the Relic panel's label reads "Unique relic" and no other characters are listed

#### Scenario: Shared relic

- **WHEN** a visitor opens a character whose relic the catalog marks as not unique
- **THEN** the Relic panel's label reads "Shared relic" and a line under the name lists the other
  characters that can equip it

#### Scenario: Character without a relic

- **WHEN** a visitor opens a character no relic can be equipped on
- **THEN** the Relic card shows "<name> has no relic.", e.g. "Lhykhis has no relic."
- **AND** on mobile the Relic section is collapsed with the summary "None"

#### Scenario: Relic rules text at a level

- **GIVEN** Hollan, who can equip Amulet of the Voidwyrm (ability `AmuletOfTheVoidwyrm`,
  `critDmgReduction` = 390, 411, 432 … 579 for levels 1–10, not rarity-affected)
- **WHEN** a visitor opens Hollan's Details tab with the Relic stepper at level 1
- **THEN** the panel reads "The relic bearer takes -390 Crit Damage for each friendly adjacent Summon or
  Decoy.", the next-level line shows 411, and the chart plots `critDmgReduction` over levels 1–10
- **AND** stepping to level 2 shows -411 and a next-level value of 432

#### Scenario: Relic with no source text

- **WHEN** a visitor opens Aun'Shi, whose relic Fidelity has no rules text in any source
- **THEN** the Relic panel shows Fidelity's icon and name with the missing-text note, no stepper and no chart

### Requirement: Mythic quests

For a character with mythic quest data, the Details tab SHALL show a Mythic quests card listing its
quests in order (up to five). Quest data (tasks, targets, parameters, rewards) SHALL come from the game
catalog's `mythic-quests` dataset; task text SHALL come from the `mythicQuestTasks` game-text namespace by the
task's `locaKey`. Each quest SHALL show its number, the task text with the task's values filled in (character
name, amounts, trait and damage type names), and its rewards as chips with icon, quantity and name (mythic
shards, ascension orbs, ability badges, XP books, gold, equipment), read from the dataset's structured reward
records. On mobile the card is a collapsible section whose header shows the quest count. A character without
quest data SHALL have no Mythic quests card: no record for the character in the dataset, or the dataset absent
from the client's catalog (a client synced against an API without it), both count as no quest data. While the
catalog loads, and when it fails to load, the page SHALL show its existing loading and load-failure states; the
card adds none of its own. A task whose `locaKey` has no template SHALL show the quest's number and rewards
without task text rather than a raw key.

Assumptions:

- Quest data is V1's (117 characters), served by the catalog.
- Task wording is V1's, in English only; other languages show English (no de/es/fr source exists).

#### Scenario: Character with quests

- **WHEN** a visitor opens Abaddon's unit page
- **THEN** the Mythic quests card shows "5 quests", and quest 1 reads "Defeat 8 enemies that have the
  Emplacement trait with Abaddon in one battle" with rewards 4 × Abaddon mythic shards, 2 × Mythic
  Chaos ascension orb and 1 × Mythic XP book

#### Scenario: Character without quest data

- **WHEN** a visitor opens a character the dataset has no record for (for example Weirdboy)
- **THEN** no Mythic quests card is shown

#### Scenario: Dataset not in the client's catalog

- **GIVEN** a client whose synced catalog has no `mythic-quests` dataset
- **WHEN** a visitor opens Abaddon's unit page
- **THEN** no Mythic quests card is shown and the rest of the page renders normally

#### Scenario: Singular task text keeps "in one battle"

- **WHEN** a visitor opens Calgar's unit page
- **THEN** quest 4 reads "Defeat 1 enemy that has the Immune trait with Calgar in one battle"

#### Scenario: Lucius's Armour of Shrieking Souls task names the hero

- **WHEN** a visitor opens Lucius's unit page
- **THEN** quest 1's task text names Lucius once and the Armour of Shrieking Souls effect once, and ends with
  "in one battle"

#### Scenario: German falls back to English task text

- **GIVEN** the language is German
- **WHEN** a visitor opens Abaddon's unit page
- **THEN** quest 1's task text is the English template with Abaddon's values, and the card's own labels and
  reward names are German
