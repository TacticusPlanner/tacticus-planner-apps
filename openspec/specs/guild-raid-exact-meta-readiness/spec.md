# Guild Raid Exact Meta Readiness Specification

## Purpose

Compares curated exact Guild Raid Meta lineups with the player's owned roster so ideal teams and concrete gaps are visible before substitution logic exists.

## Requirements

### Requirement: Exact recommendations are selected by the active boss

The system SHALL use the active status boss `unitSetId` to retrieve that boss's ordered Guild Raid Meta recommendations. It SHALL preserve the authored recommendation, hero, Machine-of-War, and Comp ordering and SHALL recompute when the boss, Meta dataset, or current player roster changes.

#### Scenario: Active boss has recommendations

- **WHEN** the active boss id has a group in the synchronized Meta dataset
- **THEN** its exact Meta and alternate recommendations are evaluated and displayed in authored order

#### Scenario: Boss changes

- **WHEN** refreshed guild status advances to a different boss
- **THEN** the exact readiness results are replaced with that boss's authored recommendations

### Requirement: Exact readiness combines ownership and investment into a percentage

For each recommendation, for each of the five ordered `heroSlots` (each with
its own `heroId`, `essential` weighting, and `replacementCharacterIds`), the
system SHALL report a `0–100%` investment-readiness value: `0%` when the
character is unowned; otherwise the average of three ratios, each
independently capped at `100%`, comparing the owned character's rank,
progression, and ability levels against a threshold derived from the boss's
own catalog stat-progression at the guild's live current step — never an
authored or invented minimum. The Machine of War SHALL receive its own
`0–100%` value using its progression level alone (Machines of War carry no
rank).

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

#### Scenario: Unowned hero is not ready

- **WHEN** an exact hero is not owned
- **THEN** its readiness is `0%` regardless of any other unit's investment

#### Scenario: Essential shortfall weighs more than flex shortfall

- **WHEN** two recommendations each have exactly one under-invested hero, one
  in an essential slot and the other in a flex slot, with identical individual
  shortfalls
- **THEN** the recommendation with the essential-slot shortfall has the lower
  team readiness percentage

### Requirement: Ideal Meta teams and roster gaps are presented together

Each recommendation card SHALL show whether it is Meta or alternate, the exact
five heroes, recommended Machine of War, referenced Comp signatures, per-hero
and Machine-of-War investment-readiness percentages, the combined team
readiness percentage, owned/missing state per unit, and the catalog
source/update attribution. Investment facts MAY be compared against the
derived threshold described above and used to compute the readiness
percentage; they SHALL NOT be used to reorder recommendations.

For a slot where the ideal hero is unowned or under-invested, the card SHALL
also show the investment-readiness percentage of every owned character listed
in that slot's `replacementCharacterIds`, so a player can compare alternatives
without leaving the card.

At or above 768px the exact lineup, readiness percentages, and summary SHALL
remain visible together in a horizontal/card layout. Below 768px the team
readiness summary SHALL precede a compact lineup and expandable Comp/source
detail without horizontal scrolling.

#### Scenario: Desktop recommendation is compared at a glance

- **WHEN** exact readiness is viewed at or above 768px
- **THEN** the lineup, its per-hero readiness percentages, and the team
  readiness percentage are visible together

#### Scenario: Mobile recommendation prioritizes readiness

- **WHEN** exact readiness is viewed below 768px
- **THEN** the team readiness percentage and missing-unit summary appear
  before expandable secondary details

#### Scenario: Flex slot shows alternative candidates

- **WHEN** a flex slot's ideal hero is unowned and the player owns two of its
  authored replacements
- **THEN** the card shows the readiness percentage of both owned replacements
  alongside the ideal hero's own state

### Requirement: Meta and roster absence states remain distinct

The system SHALL distinguish an absent local Meta dataset, a valid Meta
dataset with no group for the active boss, an unavailable current-player
roster, an absent or non-`active` live Guild Raid status (so no threshold can
be derived), and valid recommendations for which no team is Ready. Guild
status SHALL remain visible in every one of these states.

When no live Guild Raid status is available to derive a threshold, the system
SHALL fall back to ownership-only Ready/Partial/Unavailable classification for
that recommendation rather than reporting a fabricated percentage.

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
- **THEN** the system falls back to ownership-only readiness for that
  recommendation instead of computing or guessing a percentage

#### Scenario: No exact team is ready

- **WHEN** recommendations, roster, and live status all exist but each
  result's team readiness is below `100%`
- **THEN** the page presents the gaps without claiming that no Meta data
  exists or inventing a playable variant
