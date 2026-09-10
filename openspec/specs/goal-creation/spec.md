# goal-creation Specification

## Purpose

Ensures users can repeatedly create combined goals from the creation sheet
without stale submission feedback blocking a subsequent attempt.

## Requirements

### Requirement: Goal creation is ready for a subsequent use after success

The system SHALL return the goal-creation sheet to a non-submitting state when
a successful normal goal creation closes the sheet. A subsequent opening of the
same sheet instance MUST present the submit action according to the form's
current validation state, rather than treating the earlier request as active.

#### Scenario: Reopen after a successful normal creation

- **WHEN** a user submits a valid goal with "Create another" disabled, the
  creation succeeds, and the user opens the goal-creation sheet again
- **THEN** the sheet shows no submission progress indicator and its submit
  action is not disabled because of the preceding submission

### Requirement: Create-another success remains immediately usable

The system SHALL retain the existing create-another flow: after a successful
creation with "Create another" enabled, the sheet remains open with a reset
form and an idle submission state so the user can create another goal.

#### Scenario: Create another after success

- **WHEN** a user submits a valid goal with "Create another" enabled and the
  creation succeeds
- **THEN** the sheet stays open, the form is reset, and the submit action is
  no longer shown as submitting

### Requirement: The Ability card has an independent target selector per ability track

The create-goal sheet's Ability card SHALL present two separate target-level selectors —
one for the active/primary track and one for the passive/secondary track — instead of a
single target applied to both. Each selector SHALL be editable without changing the other.
A single Ability goal MAY raise one track or both tracks. The goal SHALL remain submittable
only when at least one track's target is above that track's current level; when neither
target exceeds its current level the sheet SHALL surface the existing "nothing to do"
validation message and block submission.

#### Scenario: Only one track targeted

- **WHEN** a user sets the active target above the current active level and leaves the
  passive target at the current passive level
- **THEN** the goal is valid and, on submission, the passive range starts and ends at the
  current passive level while the active range runs from the current active level to the
  chosen target

#### Scenario: Both tracks targeted at different levels

- **WHEN** a user sets the active target to one level and the passive target to a different
  level, both above their current levels
- **THEN** the goal is valid and each track's submitted range independently runs from its
  current level to its own chosen target

#### Scenario: Neither track advances

- **WHEN** both target selectors are at or below their respective current levels
- **THEN** the submit action is blocked and the sheet shows the ability "nothing to do"
  validation message

#### Scenario: Targets seed from current levels

- **WHEN** a user selects a unit and enables the Ability goal type
- **THEN** each track's target selector defaults to that track's current level plus one (or
  to the maximum ability level when the track is already at the maximum)

### Requirement: The Ability target selectors offer the full level range

Each Ability target selector SHALL offer every integer level from the track's current level
through the maximum ability level, rather than only one milestone value per rarity tier. The
track's current level SHALL itself be selectable and SHALL mean "leave this track where it
is"; levels below the current level SHALL NOT be selectable for that track. Rarity tiers MAY
be shown as visual section headers within the list. A target above the unit's current rarity
ability cap SHALL be selectable and SHALL NOT be hidden or disabled.

#### Scenario: Intermediate level is selectable

- **WHEN** a unit's active ability is at level 12 and the rarity cap is 17
- **THEN** the active target selector offers 12, 13, 14, 15, 16, and 17 as selectable options

#### Scenario: Above-cap level is selectable

- **WHEN** a unit's current rarity ability cap is 17 and the maximum ability level is 60
- **THEN** the target selector still offers levels above 17 up to 60 as selectable options

#### Scenario: Levels below the current level are not selectable

- **WHEN** a unit's passive ability is at level 20
- **THEN** the passive target selector offers 20 (meaning "leave the passive track alone") but
  no level below 20

### Requirement: An above-cap ability target auto-suggests Ascension and Level prerequisites

When a chosen ability target exceeds what the unit's current progression permits, the
create-goal sheet SHALL auto-suggest the same prerequisite goals it suggests for a
too-high Rank target:

- an Ascension prerequisite that raises the unit into the lowest rarity tier whose ability
  cap covers the higher of the two chosen targets, unless an Ascension goal covering that
  tier is already included; and
- a Level prerequisite that raises the character to the character level implied by the
  higher of the two chosen ability targets, unless a Level goal covering that level is
  already included.

Accepting a suggestion SHALL prepend the corresponding goal to the combined set with the
correct dependency ordering. This applies to Character goals; Machine-of-War Ability goals
SHALL auto-suggest Ascension only (a MoW has no Level goal).

#### Scenario: Target above the current rarity cap

- **GIVEN** an Epic unit whose ability cap is 35 and whose current character level is 30
- **WHEN** the user sets an ability target of 42
- **THEN** the sheet offers an Ascension suggestion into the Legendary tier and a Level
  suggestion to level 42

#### Scenario: Ascension already included

- **WHEN** the user has already enabled an Ascension goal that reaches the tier whose cap
  covers the ability target
- **THEN** no additional Ascension suggestion is shown for the ability target

#### Scenario: Target within the current cap

- **GIVEN** a Legendary unit whose ability cap is 50 and whose current character level is 50
- **WHEN** the user sets an ability target of 45
- **THEN** no Ascension or Level prerequisite is suggested on account of the ability target

#### Scenario: Machine of War above-cap target

- **WHEN** a Machine-of-War Ability goal's target exceeds its current rarity ability cap
- **THEN** an Ascension prerequisite is suggested and no Level prerequisite is suggested

### Requirement: Ability track labels match the entity type

The Ability card and the unit info card SHALL label the two ability tracks according to the
selected entity: "Active" and "Passive" for a Character, "Primary" and "Secondary" for a
Machine of War. This applies to both the read-only current-level fields and the target
selectors.

#### Scenario: Character labels

- **WHEN** the selected entity is a Character
- **THEN** the current-level and target fields are labelled with "Active" and "Passive"

#### Scenario: Machine-of-War labels

- **WHEN** the selected entity is a Machine of War
- **THEN** the current-level and target fields are labelled with "Primary" and "Secondary"
  and never "Active" or "Passive"
