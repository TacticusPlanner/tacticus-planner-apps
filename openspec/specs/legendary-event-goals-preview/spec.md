# legendary-event-goals-preview Specification

## Purpose

Defines how the Legendary Event page shows units as if their active goals were reached (Goals Preview), how goal targets map onto a previewed unit, the goal badge on unit tiles, and their data states.

## Requirements

### Requirement: Goal targets map onto a previewed unit

For each character the event allows, the planner SHALL derive a preview state from the account's **Active** goals for that character of kind Unlock, Ascension, Rank or Ability. Paused, Completed and Archived goals, Upgrade goals and Machine of War goals SHALL be ignored. The preview state SHALL be:

- **owned:** a unit the synced roster holds; or a unit it lacks that has any of those goals, which starts at its base state: the first progression step of its catalog `initialRarity`, rank Stone1, no applied upgrades, active and passive ability level 1;
- **progression:** the highest of its current progression and every Ascension goal's end progression;
- **rank:** the highest of its current rank and every Rank goal's end rank. When the end rank is above the current rank, applied upgrades are that goal's end applied upgrades. When it is equal, applied upgrades are the higher of the current and the end count;
- **ability levels:** each is the highest of its current level and every Ability goal's end level for that ability.

A preview SHALL never lower any value. A unit with no such goal keeps its synced state. The preview is a client calculation and SHALL NOT be stored.

Assumptions:

- Unlocking a character gives it rank Stone1, ability levels 1 and its initial rarity with that rarity's lowest star count.
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

### Requirement: Goals Preview toggle on the leaderboards and the team picker

The leaderboard controls SHALL include a **Goals Preview** switch, off by default. It is shared by the three lane leaderboards and the Overview leaderboard, kept while on the event page and reset to off on leaving it. The team picker SHALL carry its own Goals Preview switch whose initial value is the page's value. Changing it in the picker SHALL NOT change the page's value. While a switch is on, its list SHALL evaluate each unit at its preview state:

- owned state, and therefore the Only unlocked filter;
- the rarity and rank badges;
- the estimated clears (lane leaderboards and picker tiles).

A unit whose preview differs from its synced state SHALL carry a "preview" marker, with accessible text naming the goals applied. Points figures, order inputs other than ownership, team cards, upgrade impact, suggestions and every stored value SHALL NOT change with the switch.

#### Scenario: Preview raises a unit's estimate on the leaderboard

- **GIVEN** the Tigurius worked example and the Alpha leaderboard
- **WHEN** the user turns Goals Preview on
- **THEN** Tigurius's row shows Legendary rarity, the Gold II rank badge, "Clears ~7" and the preview marker, and its points figure is unchanged

#### Scenario: Preview with Only unlocked

- **GIVEN** Only unlocked is on and Certus is locked with an Active Unlock goal
- **WHEN** the user turns Goals Preview on
- **THEN** Certus appears on every lane and Overview leaderboard that allows him, with the preview marker, and disappears again when the switch is turned off

#### Scenario: Picker starts from the page value

- **GIVEN** Goals Preview is on on the page
- **WHEN** the user opens the team editor and turns the picker's switch off
- **THEN** the picker shows synced states, and the page's leaderboards still show the preview after the editor closes

#### Scenario: Shared across tabs, reset on leaving

- **GIVEN** Goals Preview is on on the Alpha tab
- **WHEN** the user switches to Overview, then leaves the event page and comes back
- **THEN** Overview shows the preview, and after coming back the switch is off

#### Scenario: Desktop placement

- **WHEN** the leaderboard renders at or above 768px
- **THEN** the Goals Preview switch sits in the controls row beside Only unlocked and Deduct scored points

#### Scenario: Mobile placement

- **WHEN** the leaderboard renders below 768px
- **THEN** the Goals Preview switch sits in the compact controls bar above the list, with a touch target of at least 44px

### Requirement: Unit tiles carry a goal badge

A leaderboard row (lane and Overview), a team picker tile, an upgrade impact row and a suggestion member SHALL show a goal badge when the unit has at least one Active Unlock, Ascension, Rank or Ability goal (the goals Goals Preview reads, so their targets are known). The badge's accessible text and tooltip SHALL list each such goal by kind and target (for example "Rank to Gold II", "Ascension to Legendary 3 red stars", "Unlock"). The badge SHALL NOT depend on the Goals Preview switch. After a goal is created from the event page the badge SHALL appear without a page reload.

#### Scenario: Badge lists the goals

- **GIVEN** the Tigurius worked example's two goals
- **WHEN** his leaderboard row renders
- **THEN** a goal badge follows his name, and its tooltip reads "Rank to Gold II" and "Ascension to Legendary 3 red stars"

#### Scenario: Badge after creating a goal

- **GIVEN** Titus has no goal
- **WHEN** the user creates an Ascension goal for Titus from his row's actions menu
- **THEN** Titus's row shows the goal badge once the creation sheet closes

### Requirement: Goals Preview and badges degrade by data state

While the goals are loading, no badge SHALL show and the switch SHALL be disabled with a busy indicator. When the goal list failed to load, no badge SHALL show and the switch SHALL be disabled with the note "Goals unavailable". When no Active goal targets a unit the event allows, the switch SHALL be disabled with the hint "No active goals for this event's units". When there is no synced roster to preview over, the switch SHALL be disabled with the hint "Sync your roster to preview goals". After a goal is created, the previous badges and preview SHALL stay shown while the goal list refreshes; if that refresh fails, the failed-load state applies (no badge, and the switch disabled with "Goals unavailable"). When clear estimates are unavailable (see `legendary-event-clear-estimates`), the preview SHALL still change ownership, rarity and rank, and no Clears figure SHALL show. The goals list is the only goal read the page makes; no per-goal read SHALL be issued for targets.

#### Scenario: Goals unavailable

- **GIVEN** the goal list read failed
- **WHEN** the event page renders
- **THEN** no goal badge renders, the Goals Preview switch is disabled and "Goals unavailable" is shown beside it

#### Scenario: No active goals for the event

- **GIVEN** the account's Active goals all target units the event does not allow
- **WHEN** the leaderboard renders
- **THEN** the Goals Preview switch is disabled with the hint "No active goals for this event's units"

#### Scenario: Targets come from the list

- **GIVEN** the goals list has loaded with five Active goals for the event's units
- **WHEN** the leaderboard renders badges and the preview
- **THEN** every badge tooltip and preview value is derived from the list and no further goal request is issued
