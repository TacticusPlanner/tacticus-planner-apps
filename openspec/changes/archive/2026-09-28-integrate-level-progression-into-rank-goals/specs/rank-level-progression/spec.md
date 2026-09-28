## Purpose

Makes the character level a Rank or Ability target needs visible and costed on that goal, without a separate Level goal, and keeps shared level XP from being counted twice.

## ADDED Requirements

### Requirement: A Rank or Ability goal shows the level it needs

For a Character Rank goal, the goal, its detail, and the creation preview SHALL derive the level required by its end rank and partial upgrade slots; for a Character Ability goal, the level implied by the higher of its two ability targets. When the character's current level is below that requirement, the goal SHALL show the required level, the current level, the remaining XP, and Potential progress from owned XP books, presented as ordinary progress on that goal. It SHALL NOT be presented as a separate goal, a dependency, or a restriction. Creation SHALL NOT suggest, create, or accept a Level goal for either kind; genuine Unlock and Ascension prerequisites are still suggested.

#### Scenario: Rank target needs a higher level

- **GIVEN** Bellator is below level 32 and the user targets Silver3, whose rank-level ladder requires level 32
- **WHEN** the combined-goal preview is shown
- **THEN** Bellator's Rank preview shows the required level 32, the current level, and the remaining XP, and no Level goal is added

#### Scenario: Ability target needs a higher level

- **GIVEN** a Character Ability target implies a level above the character's current level
- **WHEN** the Ability goal is previewed or listed
- **THEN** the Ability goal shows its required level and remaining XP and no Level prerequisite is suggested

#### Scenario: Level is sufficient

- **GIVEN** the character is at or above the level the target needs
- **WHEN** the goal renders
- **THEN** no required-level or XP line is shown for it

### Requirement: Level XP is counted once across a unit's targets

For each unit in the effective plan, the level XP its Rank milestones and Ability goal need SHALL be derived once from the character's current total XP to the highest required level, and owned XP books SHALL be allocated in effective goal-priority order so no book or XP interval is credited to two goals. Actual level SHALL remain below the requirement until synced progression reaches it; Potential progress from owned books SHALL NOT be treated as attained. Summaries and consumers (Goals, Insights, Dailies) SHALL derive from the same per-goal allocation. XP is the common unit and each goal's remaining XP is anchored to the character's current total XP and its own required level.

Assumptions:

- Bellator Silver3 requires level 32 in the current rank-level ladder.
- A Legendary XP book contributes 12,500 XP and is consumed whole; rarity and level caps continue to apply.

#### Scenario: Worked Bellator XP gap

- **GIVEN** Bellator has 82,000 total XP and the level-32 threshold is 94,200 XP, with one owned Legendary XP book unclaimed by a higher-priority goal
- **WHEN** a Rank target requiring level 32 is previewed
- **THEN** the raw gap is 94,200 - 82,000 = 12,200 XP; the whole 12,500-XP book can cover it for Potential progress, but Actual level remains below 32 until synced progression changes

#### Scenario: Overlapping Rank milestones share level XP

- **GIVEN** two Bellator Rank milestones whose required levels overlap
- **WHEN** the plan is shown
- **THEN** the shared XP interval and owned books are charged to the higher-priority milestone once, and the other charges only its additional XP

### Requirement: Level goals do not exist in the client

The client SHALL NOT offer a Level goal type in creation, SHALL NOT render a Level goal row or card, SHALL NOT fold a Level goal into another goal's row, and SHALL NOT treat a Level goal as a prerequisite or a blocker reason. The required-level display on Rank and Ability goals replaces all of these.

#### Scenario: No Level option in creation

- **WHEN** a user opens goal creation for a character
- **THEN** no Level goal card or Level prerequisite suggestion appears, for Rank or Ability

#### Scenario: No Level rows

- **WHEN** the Goals list renders for an account
- **THEN** no goal row or card is a Level goal, and no goal shows a Level sub-line other than its own required-level display
