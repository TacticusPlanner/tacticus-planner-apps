## ADDED Requirements

### Requirement: One per-unit diff between two rosters

The system SHALL compute, for a "from" roster and a "to" roster (each a snapshot or the current synced roster), one diff entry per unit owned in "to", with these fields:

- **unlocked**: absent in "from", owned in "to";
- **progression** from → to (rarity and stars), when later;
- **rank** from → to, when later;
- **applied upgrades** at the "to" rank (n/6), when it is the same rank and more slots are applied;
- **XP level** from → to, and **XP** gained;
- **shards** and **mythic shards**: net, spent and earned (see "Shards spent on progression are counted");
- each **ability** whose level rose, from → to;
- each **equipment slot** whose item changed or whose level rose;
- **power** from → to and the delta.

Rank, progression, XP level and ability levels that went down SHALL be ignored. Shards MAY go down. A unit owned in "from" but not in "to" SHALL be omitted. A unit is **changed** when any field above changed. For a `V1Import` snapshot (follow-up), XP and applied upgrades SHALL be shown as unknown ("—"), never as a change.

Assumptions:

- Power comes from `character-combat-power` (characters) and `unit-power` (MoWs), evaluated at each side's state.
- Progression step costs come from the catalog progression rules (the shard and mythic-shard costs to reach each step).

#### Scenario: Worked example, Calgar progressed

- **GIVEN** "from" has `ultraCalgar` at Diamond1, `Legendary:RedFiveStars`, 4/6 upgrades, XP level 45, 320 shards, active 40, passive 38, and "to" has him at Diamond3, `Legendary:OneBlueStar`, 1/6 upgrades, XP level 48, 80 shards, active 45, passive 38
- **WHEN** the diff is computed
- **THEN** Calgar is changed with rank Diamond1 → Diamond3, stars 5 red → 1 blue, XP level 45 → 48, active 40 → 45, shards net −240, spent 500 and earned +260, no passive line, and no applied-upgrades line (the rank changed)

#### Scenario: Unchanged unit

- **GIVEN** a unit with identical values on both sides
- **WHEN** the diff is computed
- **THEN** its entry is not changed

### Requirement: Shards spent on progression are counted

For each progression step crossed from "from" to "to", the step's shard cost SHALL be added to **shards spent**, and its mythic-shard cost to **mythic shards spent**. When the unit was unlocked in between, its unlock shard cost SHALL be added too. **Earned** SHALL equal `to − from + spent`, for shards and mythic shards separately.

#### Scenario: Worked example, one promotion

- **GIVEN** `ultraCalgar` went from `Legendary:RedFiveStars` with 320 shards to `Legendary:OneBlueStar` with 80 shards, and reaching `Legendary:OneBlueStar` costs 500 shards
- **WHEN** shards are computed
- **THEN** spent is 500, net is 80 − 320 = −240, and earned is −240 + 500 = 260

### Requirement: The summary is derived from the diff

The summary SHALL be computed from the same diff entries, never recalculated, over the units currently listed. It SHALL show:

- units unlocked;
- ascensions (rarity rose);
- promotions (stars rose within or across rarity, counting each step crossed);
- rank-ups (ranks gained);
- ability levels gained;
- upgrades applied (at the same rank);
- shards and mythic shards earned;
- total power gained.

#### Scenario: Summary over two units

- **GIVEN** diffs where Calgar gained 2 ranks, 1 star step and 5 ability levels, and Titus was unlocked
- **WHEN** the summary is computed
- **THEN** it reads 1 unlocked, 0 ascensions, 1 promotion, 2 rank-ups and 5 ability levels

### Requirement: Legendary Event run history uses the shared diff

The Legendary Event "Roster changes since the previous run" list SHALL be produced by projecting the shared diff onto that requirement's fields and rules (see `legendary-event-run-history`). Its output SHALL be unchanged.

#### Scenario: LE output unchanged

- **GIVEN** the LE run-history worked example for Calgar
- **WHEN** it is computed through the shared diff
- **THEN** it lists exactly rank Diamond 1 → Diamond 3, stars 5 red → 1 blue and active 40 → 45
