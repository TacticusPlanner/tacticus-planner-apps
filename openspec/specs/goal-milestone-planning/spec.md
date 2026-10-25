# goal-milestone-planning Specification

## Purpose

Plans several goals of one type for one unit as separate milestones: overlapping progression is allocated once, a covered milestone stays its own goal, and each milestone shows its range from the previous one.

## Requirements

### Requirement: Distinct goals of one type for one unit remain separate goals

Goals and project views SHALL show each in-flight Ascension, Ability and Upgrade goal of a unit as its own row/card with its own target label, status, memberships and actions, exactly as `rank-milestone-planning` does for Rank. Each SHALL be independently reorderable, pausable, resumable, editable and deletable.

#### Scenario: Two Ascension milestones in the list

- **GIVEN** Ragnar has Ascension goals ending at `Legendary:RedFourStars` and `Legendary:OneBlueStar`
- **WHEN** the Goals list renders
- **THEN** two Ascension rows show their own target labels and independent reorder/status/delete actions

### Requirement: Overlapping Ascension progression is allocated once

Ascension goals of a unit SHALL be allocated in effective priority order: each progression step SHALL be charged to the first goal whose range contains it, and owned shards SHALL be drawn once in that order. Rows and totals SHALL share this allocation (shards; orbs per rarity).

Assumptions:

- Step costs: `ascension-costs` catalog dataset.
- Owned orbs are not netted (unchanged).
- Each goal's own acquisition sources still farm its remainder.

#### Scenario: Worked overlapping Ragnar Ascension milestones

- **GIVEN** Ragnar is at `Epic:RedThreeStars` with 40 owned shards. Priority 1 targets `Legendary:RedFourStars`, crossing `Legendary:RedThreeStars` (100 shards, 10 Legendary orbs) and `Legendary:RedFourStars` (150 shards, 10 orbs). Priority 2 targets `Legendary:OneBlueStar`, crossing those same two steps plus `Legendary:RedFiveStars` (250 shards, 15 orbs) and `Legendary:OneBlueStar` (500 shards, 20 orbs)
- **WHEN** the plan demand is calculated
- **THEN** priority 1 is charged 100 + 150 = 250 shards and 20 orbs, minus the 40 owned shards, for 210 shards to farm
- **AND** priority 2 is charged only 250 + 500 = 750 shards and 15 + 20 = 35 orbs, because the owned shards are already used
- **AND** the aggregate is 960 shards and 55 Legendary orbs, not today's 210 + (1,000 − 40) = 1,170 shards and 20 + 55 = 75 orbs

### Requirement: A covered Ascension milestone stays a distinct, uncompleted goal

An Ascension goal wholly covered by higher-priority siblings SHALL remain a distinct goal with no additional demand and SHALL NOT be marked completed until synced progression reaches its own end.

#### Scenario: Higher Ascension target ordered first covers the lower one

- **GIVEN** the `Legendary:OneBlueStar` goal precedes the `Legendary:RedFourStars` goal for Ragnar
- **WHEN** the plan is calculated
- **THEN** the OneBlueStar goal is charged all four steps, the RedFourStars goal has zero additional demand, and it stays uncompleted until synced progression reaches `Legendary:RedFourStars`

#### Scenario: Standalone estimate is unchanged

- **WHEN** one Ascension goal's standalone estimate is shown, outside plan allocation
- **THEN** it charges its whole range and nets all owned shards, as before

### Requirement: Overlapping Ability and Upgrade goals are allocated once

Multiple Ability goals of one unit SHALL claim each ability-level transition once, in effective priority order, through the unit's shared transition coverage. Upgrade goals SHALL keep netting against Rank slots and ability transitions claimed by any goal of the unit, including several Ability or Upgrade goals.

#### Scenario: Two Character Ability milestones

- **GIVEN** Calgar is at ability 40/40 with priority 1 targeting 45/45 and priority 2 targeting 50/50
- **WHEN** the plan is calculated
- **THEN** priority 1 is charged the transitions 40→45 on both tracks, priority 2 only 45→50 on both, and the aggregate equals one 40/40 → 50/50 goal

### Requirement: A milestone shows its range from the previous milestone

A goal row's displayed range start SHALL be the end of the nearest in-flight goal of the same unit and type that has higher priority and ends below it, or the unit's live progression when none does. A goal whose plan demand is zero because a higher-priority sibling covers it SHALL show a note naming that sibling. Display only: the stored start is not changed.

#### Scenario: Ladder range labels

- **GIVEN** Ragnar at Silver2 has in-flight Rank goals Gold1 (priority 1), Diamond3 (priority 4) and Adamantine1 (priority 9)
- **WHEN** the list renders
- **THEN** they read Silver2 → Gold1, Gold1 → Diamond3 and Diamond3 → Adamantine1

#### Scenario: Covered milestone note

- **GIVEN** Adamantine1 precedes Diamond3 for Ragnar
- **WHEN** the list renders
- **THEN** the Diamond3 row shows no remaining demand and a note that the Adamantine1 goal covers it
