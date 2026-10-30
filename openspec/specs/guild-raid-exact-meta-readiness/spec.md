# Guild Raid Exact Meta Readiness Specification

## Purpose

Fills each curated Guild Raid Meta lineup from the player's owned roster, using the lineup's authored substitutes, and shows how far each picked unit is from the active boss step's investment target.

## Requirements

### Requirement: Exact recommendations are selected by the active boss

The system SHALL use the active status boss `unitSetId` to retrieve that boss's ordered Guild Raid Meta recommendations. It SHALL preserve the authored recommendation, hero, Machine-of-War, and Comp ordering and SHALL recompute when the boss, Meta dataset, or current player roster changes.

#### Scenario: Active boss has recommendations

- **WHEN** the active boss id has a group in the synchronized Meta dataset
- **THEN** its exact Meta and alternate recommendations are evaluated and displayed in authored order

#### Scenario: Boss changes

- **WHEN** refreshed guild status advances to a different boss
- **THEN** the exact readiness results are replaced with that boss's authored recommendations

### Requirement: Each lineup is filled from the roster with authored substitutes

For each recommendation, the system SHALL fill the five ordered `heroSlots`
and the Machine of War from the owned roster. A slot whose ideal unit is owned
SHALL keep it. Any other hero slot MAY be filled only from that slot's own
`replacementCharacterIds`, never with a hero already used elsewhere in the same
lineup, preferring filled essential slots, then filled slots, then higher
readiness. A Machine of War that is not owned SHALL be replaced by the
highest-readiness owned unit in `mowReplacementIds`. Comp membership SHALL
never be used to substitute.

Each lineup SHALL report one status: `ready` when every slot holds its ideal
unit, `missingEssentials` when an essential hero slot has no owned option, and
`substitutes` otherwise. The status SHALL be resolved from ownership alone when
no investment threshold is available.

#### Scenario: Substitute fills an unowned slot

- **WHEN** a core slot's ideal hero is unowned and the player owns one of its
  authored replacements that no other slot uses
- **THEN** that replacement is shown in the slot as standing in for the ideal
  hero and the lineup status is `substitutes`

#### Scenario: Owned ideal is not taken by another slot

- **WHEN** a hero is both a flex slot's owned ideal and an authored
  replacement for another slot
- **THEN** the hero stays in its own flex slot and is listed in the other
  slot's options as already used in this lineup

#### Scenario: Essential slot cannot be filled

- **WHEN** an essential slot's ideal hero is unowned and no free authored
  replacement is owned
- **THEN** the lineup status is `missingEssentials`

### Requirement: Readiness combines ownership and investment into a percentage

Each hero slot SHALL report the `0–100%` investment readiness of the unit
picked for it, `0%` when the slot is empty: the average of three ratios, each
independently capped at `100%`, comparing the unit's rank, progression, and
ability levels against a threshold derived from the boss's own catalog
stat-progression at the guild's live current step — never an authored or
invented minimum. The Machine of War SHALL use its progression level alone.
Every listed option SHALL carry its own readiness the same way.

The system SHALL combine the five hero values and the Machine-of-War value
into one team readiness percentage, weighting a slot marked `essential` higher
than a non-essential slot. The system SHALL NOT calculate expected damage,
turn-order/mechanic effectiveness, or synergy — the percentage measures
investment against the derived threshold only.

#### Scenario: Owned, sufficiently-invested hero is fully ready

- **WHEN** an owned hero's rank, progression, and ability levels each meet or
  exceed the boss's currently-derived threshold
- **THEN** that hero's readiness is `100%`

#### Scenario: Owned but under-invested hero is partially ready

- **WHEN** an owned hero's ability levels are below the derived threshold
  while rank and progression meet it
- **THEN** that hero's readiness reflects the shortfall and is below `100%`
  without being reported as `0%`

#### Scenario: Empty slot is not ready

- **WHEN** a slot has no owned option
- **THEN** its readiness is `0%` and no other unit's percentage is shown on
  the unowned ideal hero

#### Scenario: Essential shortfall weighs more than flex shortfall

- **WHEN** two recommendations each have exactly one under-invested hero, one
  in an essential slot and the other in a flex slot, with identical individual
  shortfalls
- **THEN** the recommendation with the essential-slot shortfall has the lower
  team readiness percentage

### Requirement: Lineups are presented slot by slot

The section SHALL show the investment target (rarity and stars, rank, ability
level) once, above the lineups, with an explanation of how readiness is
scored, and SHALL show the catalog source and update date once.

Recommendations SHALL appear as tabs in authored order, each labelled with its
kind and team readiness; investment facts SHALL NOT reorder them. Each lineup
SHALL show its status, team readiness, efficiency, and Comps, then one tile per
slot with the slot's role (or Machine of War), whether it is essential, the
picked unit's name and portrait, the ideal unit it stands in for when it is a
substitute, and its readiness. Units SHALL always be shown by name, never by
raw id.

Selecting a slot SHALL list every option for it — the ideal unit and each
authored replacement — with its name, portrait, readiness, and why it is or
isn't the pick (in this lineup, used in another slot, owned, or not owned).

At or above 768px the slots SHALL appear side by side with the selected slot's
options below them. Below 768px the slots SHALL be a vertical list with the
options expanding under the selected slot, without horizontal scrolling.

#### Scenario: Player asks what an alternative is

- **WHEN** a slot is filled by a substitute
- **THEN** the slot names the substitute and the ideal hero it replaces, and
  selecting the slot lists the ideal hero and every authored replacement by
  name with their readiness

#### Scenario: Desktop lineup is compared at a glance

- **WHEN** a lineup is viewed at or above 768px
- **THEN** all six slots, their readiness, and the team readiness are visible
  together

#### Scenario: Mobile lineup stays readable

- **WHEN** a lineup is viewed below 768px
- **THEN** the slots stack vertically and a selected slot's options open
  directly beneath it

### Requirement: Each lineup points at where to invest next

Once the roster is known, each lineup SHALL list every empty slot (naming its
ideal unit) and the filled slot furthest below the target, preferring an
essential slot below `100%` over any other slot. Selecting a line SHALL open
that slot's options. Nothing SHALL be listed when every slot is filled and at
`100%`.

#### Scenario: Weakest essential slot is named

- **WHEN** a lineup's essential slots are at `90%` and `60%` and a flex slot
  is at `40%`
- **THEN** the lineup names the `60%` essential slot as the place to invest
  next

#### Scenario: Empty slot is named

- **WHEN** a flex slot has no owned option
- **THEN** the lineup says that slot is empty and names the ideal unit to get

### Requirement: Meta and roster absence states remain distinct

The system SHALL distinguish an absent local Meta dataset, a valid Meta
dataset with no group for the active boss, an unavailable current-player
roster, an absent or non-`active` live Guild Raid status (so no threshold can
be derived), and valid recommendations for which no team is Ready. Guild
status SHALL remain visible in every one of these states.

When no live Guild Raid status is available to derive a threshold, the system
SHALL still show each lineup's picks and status, resolved from ownership alone,
and SHALL say why percentages are missing rather than reporting a fabricated
percentage.

#### Scenario: Meta data has not synchronized

- **WHEN** no local Guild Raid Meta record exists
- **THEN** the recommendation region asks for catalog synchronization and does
  not describe the boss as unsupported

#### Scenario: Boss has no published Meta

- **WHEN** the Meta dataset is present but contains no group for the active
  boss
- **THEN** the region states that no curated recommendation is available for
  that boss

#### Scenario: Player roster is unavailable

- **WHEN** recommendations exist but the current player's roster data is
  absent
- **THEN** ideal lineups remain visible, readiness is withheld, and the user
  is prompted to synchronize player data

#### Scenario: Live guild status is unavailable

- **WHEN** recommendations and roster exist but no live Guild Raid status has
  been observed for the guild
- **THEN** each lineup shows its picks and status without any percentage, and
  the section says readiness needs the live raid status

#### Scenario: No exact team is ready

- **WHEN** recommendations, roster, and live status all exist but each
  result's team readiness is below `100%`
- **THEN** the page presents the gaps without claiming that no Meta data
  exists or inventing a playable variant
