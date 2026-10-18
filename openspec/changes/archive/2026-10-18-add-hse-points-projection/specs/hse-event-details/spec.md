## ADDED Requirements

### Requirement: The reward tier is resolved from the roster

For the selected HSE instance the system SHALL resolve the variant (`parameters.hseVariant`, else the variant keyed by `parameters.targetFactionId`, else `default`) and then the tier: `High` when the player's power level is at least `PL_MEDIUM` (20) and the roster holds a character or machine of war at Legendary one blue star or above (Mythic included); `Mid` when the power level is at least 20 without such a unit; `Low` below 20. When the variant has no tier of that key it SHALL use its `Default` tier. When the variant has more than one tier, the details SHALL show the player's power level and the resolved tier with a tooltip stating the three rules; with a single tier they SHALL show neither.

Assumptions:

- Tier thresholds follow V1 (`plTier`): power level 20 and the first blue star.
- Power level and roster come from the synced player data; the app always has it.

#### Scenario: High tier

- **GIVEN** power level 62 and a Legendary one-blue-star Mephiston
- **THEN** Psyker Boost resolves to `High`, final milestone 765

#### Scenario: Mid tier

- **GIVEN** power level 35 and no unit at one blue star
- **THEN** Psyker Boost resolves to `Mid`, final milestone 605

#### Scenario: Single-tier event

- **GIVEN** the October 2026 Faction Focus (variant `october-2026`, only a `Default` tier)
- **THEN** the `Default` tier is used and no power level or tier is shown

### Requirement: The details show the event's description and milestones

For an instance whose definition has `config.hse`, Dailies > HSE SHALL show, for every status (running, upcoming, past): the event icon and name; description lines generated on the client from the variant's modifiers and trackers (an XP line per `UnitXp` modifier, a stat line per `StatBoost` modifier, a points line per tracker naming points, the units or enemies it counts, the excluded Summons and the game modes), in en, de, es and fr; and the milestone grid. Each milestone cell SHALL show its incremental points (its cumulative points minus the previous milestone's), the reward icon and quantity (from the reward display used by Shops; an unknown reward id shows a generic reward icon and the id as label) and a tooltip naming the reward and its cumulative points. A repeat step SHALL be the last cell, marked endless, showing its step points and, when `cap` is set, "up to N times". A `Global` variant SHALL be labelled as a community event whose milestones count every player's points. Without `config.hse` (Against the Tide) the details SHALL say milestone data is not available yet. Paid offers SHALL NOT be shown.

#### Scenario: Psyker Boost description

- **GIVEN** Psyker Boost, High tier
- **THEN** the description reads, in the player's language: Psyker characters gain 3x XP in Arena, Onslaught and Salvage Run; Psyker characters have +20% Health, +20% Damage and +20% Armour in Arena; you gain 1 point for each enemy unit (excluding Summons) you defeat with a Psyker unit in Arena, Onslaught and Salvage Run

#### Scenario: Psyker Boost milestone grid

- **GIVEN** Psyker Boost, High tier
- **THEN** the grid shows 20 cells; the first five read 20, 20, 20, 20, 25 points with Uncommon ability tokens x3, Rare x2, Epic x1, Legendary x1, Uncommon x5; the 19th reads 60 points (765 minus 705) with Mythic ability tokens x5; the 20th is marked endless with 50 points and Legendary ability tokens x1

#### Scenario: Past event keeps its details

- **GIVEN** the player selects Machine Hunt of 2026-10-02
- **THEN** its description and milestone grid are shown

#### Scenario: Global event

- **GIVEN** Operation Imperator is selected
- **THEN** the grid shows its Default tier and a note that milestones count every player's points

#### Scenario: No data

- **GIVEN** Against the Tide is selected
- **THEN** the details say milestone data is not available yet

#### Scenario: On mobile

- **WHEN** the viewport is below 768px
- **THEN** the milestone grid has 3 columns and the description shows its first line with a Show more control

#### Scenario: On desktop

- **WHEN** the viewport is at or above 768px
- **THEN** the milestone grid has 5 columns and the description is shown in full
