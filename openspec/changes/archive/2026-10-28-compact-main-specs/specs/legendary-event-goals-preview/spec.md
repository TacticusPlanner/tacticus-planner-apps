## MODIFIED Requirements

### Requirement: Goal targets map onto a previewed unit

For each character the event allows, the planner SHALL derive a preview state from the account's **Active** goals for that character of kind Unlock, Ascension, Rank or Ability. Paused, Completed and Archived goals, Upgrade goals and Machine of War goals SHALL be ignored. The preview state SHALL be:

- **owned:** a unit the synced roster holds; or a unit it lacks that has any of those goals, which starts at its base state: the first progression step of its catalog `initialRarity`, rank Stone1, no applied upgrades, active and passive ability level 1;
- **progression:** the highest of its current progression and every Ascension goal's end progression;
- **rank:** the highest of its current rank and every Rank goal's end rank. When the end rank is above the current rank, applied upgrades are that goal's end applied upgrades. When it is equal, applied upgrades are the higher of the current and the end count;
- **ability levels:** each is the highest of its current level and every Ability goal's end level for that ability.

A preview SHALL never lower any value. A unit with no such goal keeps its synced state. The preview is a client calculation and SHALL NOT be stored.

Assumptions:

- Which objectives a unit satisfies depends only on static catalog data (faction, alliance, traits, damage types, hits, attack type), so a preview never changes objective matching or points.
- Power (the `character-combat-power` estimate) and the horde-mode multiplier are computed exactly as `legendary-event-clear-estimates` specifies, from the preview state. Equipped items are the synced ones (none for a unit the roster lacks): goals do not change equipment.

#### Scenario: Worked example, rank and ascension goals

- **GIVEN** `powerRatio` 1.2, `ultraTigurius` in a horde-mode tier with multiplier 1.2, and Tigurius owned at Gold1, Epic:RedOneStar, slots 0 to 2 applied, active 20, passive 15, no items (power 16,672, effective 20,006.4, estimated clears on Uthar Alpha 6: 5 × 20,006.4 = 100,032 reaches battle 6's threshold 90,944.4 and not battle 7's 161,523.6)
- **AND** Tigurius has two Active goals: Ascension to Legendary:RedThreeStars and Rank to Gold2 with 0 applied upgrades
- **WHEN** the preview state is derived
- **THEN** it is Gold2, Legendary:RedThreeStars, 0 upgrades, active 20, passive 15, with power 28,224 and effective power 28,224 × 1.2 = 33,868.8
- **AND** its estimated clears on Uthar Alpha are 7: 5 × 33,868.8 = 169,344 reaches battle 7's threshold 1.2 × 134,603 = 161,523.6 and not battle 8's 1.2 × 225,385 = 270,462

#### Scenario: Worked example, unlock goal

- **GIVEN** `powerRatio` 1.2 and `ultraEliminatorSgt` (Certus, initial rarity Common) is not in the roster and has an Active Unlock goal
- **WHEN** the preview state is derived
- **THEN** Certus is owned at Stone1, Common:None, 0 upgrades, abilities 1/1, no items, with power 45
- **AND** its estimated clears on Uthar Alpha are 0: 5 × 45 = 225 is below battle 1's threshold 1.2 × 1,018 = 1,221.6

#### Scenario: A goal below the current state changes nothing

- **GIVEN** a unit owned at Diamond1 with an Active Rank goal ending at Gold3
- **WHEN** the preview state is derived
- **THEN** its rank stays Diamond1

#### Scenario: Paused goals are ignored

- **GIVEN** a locked unit whose only goal is a Paused Unlock goal
- **WHEN** the preview state is derived
- **THEN** the unit stays locked
