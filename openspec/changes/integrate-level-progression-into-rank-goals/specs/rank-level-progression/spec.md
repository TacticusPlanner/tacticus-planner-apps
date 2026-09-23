## Purpose

Makes routine character leveling visible and costed within Rank milestones without hiding independently authored Level or Ability-prerequisite goals.

## ADDED Requirements

### Requirement: Creating a Rank goal includes routine level progression

For a Character Rank target, the creation flow SHALL derive the level required by its rank and partial upgrade slots and SHALL show that level/XP requirement within the Rank preview. It SHALL NOT suggest a separate Level goal solely for Rank. It SHALL continue to suggest genuine Unlock/Ascension prerequisites, and Level prerequisites for Ability when needed.

#### Scenario: Rank target needs a higher level

- **GIVEN** Bellator is below level 32 and the user targets Silver3, whose rank-level ladder requires level 32
- **WHEN** the combined-goal preview is shown
- **THEN** Bellator's Rank preview includes leveling to 32 and does not add a separate Level goal solely for it

#### Scenario: Ability still needs an independent Level prerequisite

- **GIVEN** a Character Ability target needs a higher level than the current character level
- **WHEN** that Ability target is created without a covering Level goal
- **THEN** a Level prerequisite remains available under the existing Ability rules

### Requirement: Rank progress and XP demand are counted once

The Rank milestone SHALL show actual synced rank/slot and level progress together, and potential XP progress from owned books without treating potential as attained. Where a Rank and an independent/shared Level goal cover the same level interval, plan demand and owned books SHALL be allocated once in effective goal-priority order; summaries SHALL derive from the same per-goal allocation. Estimates compared across goals SHALL use XP as the common unit and anchor their remaining XP to each character's current total XP and target level.

Assumptions:

- Bellator Silver3 requires level 32 in the current rank-level ladder.
- A Legendary XP book contributes 12,500 XP and is consumed whole; rarity/level caps continue to apply.

#### Scenario: Worked Bellator XP gap

- **GIVEN** Bellator has 82,000 total XP and the level-32 threshold is 94,200 XP, with one owned Legendary XP book unclaimed by a higher-priority goal
- **WHEN** a Rank target requiring level 32 is previewed
- **THEN** the raw gap is 94,200 − 82,000 = 12,200 XP; the whole 12,500-XP book can cover that gap for Potential progress, but Actual level remains below 32 until synced progression changes, and no second Level row claims the same book

#### Scenario: Shared Ability Level goal is not erased

- **GIVEN** a legacy Level goal is a prerequisite of both Bellator Rank and Ability goals
- **WHEN** the plan is shown
- **THEN** the Level goal remains independently addressable for Ability and its XP/book allocation is not duplicated by Rank

### Requirement: Legacy Rank-only Level pairs show one milestone

A stored Level goal linked only as a Rank prerequisite SHALL be folded into the Rank presentation and excluded from a second effective planning contribution, while its id/detail remains recoverable. A standalone Level goal SHALL remain a separate row and editable goal.

#### Scenario: Imported Rank-only pair

- **GIVEN** an imported Rank goal depends on a Level goal with no other dependent
- **WHEN** Goals, Insights, and Dailies derive the effective plan
- **THEN** one Rank milestone accounts for the level work, no duplicate Level row or XP demand appears, and the Level detail remains addressable by id

#### Scenario: Standalone Level goal

- **WHEN** a user opens Goals with an intentional Level target unrelated to Rank
- **THEN** it remains its own goal row and contributes its own distinct target demand
