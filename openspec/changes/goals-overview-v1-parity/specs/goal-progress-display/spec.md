## MODIFIED Requirements

### Requirement: Remaining resource text uses a per-goal-kind formatter for Rank and Unlock goals with thousands separators

Wherever the goal progress display shows a still-needed resource text for a goal outside the list's Remaining column (the tooltip on the Progress column's percent readout, a screen-reader label, the goal-detail header), it SHALL use one formatter per goal kind: a Rank goal SHALL show "{{energy}} energy" when a farming energy estimate is available and no upgrade-slot count; an Unlock goal SHALL show "{{shards}} shards" (remaining shard need, per `goal-farming-estimates`' zero-once-owned rule). The Goals list's Remaining column itself renders chips per `goal-remaining-resources`. A level requirement's remaining text is defined by "A Rank or Ability goal's level requirement carries its own remaining text and explanation". Every number formatted by this requirement SHALL render with the locale's thousands separator.

Assumptions:

- This requirement only changes how an already-computed remaining count is formatted for display; it does not change any calculation in `goal-farming-estimates` or `computeGoalProgress`.
- A Rank goal with no farming energy estimate available (for example, no project context) SHALL show no remaining text from this requirement rather than a placeholder.

#### Scenario: Rank goal with both slots and energy available

- **GIVEN** a Rank goal has 9 upgrade slots remaining and a farming estimate of 1,674 remaining energy
- **WHEN** its remaining text renders in the progress tooltip
- **THEN** it reads "1,674 energy", with no slot count

#### Scenario: Unlock goal

- **GIVEN** an Unlock goal has 227 shards remaining
- **WHEN** its remaining text renders
- **THEN** it reads "227 shards"

### Requirement: A Rank or Ability goal's level requirement carries its own remaining text and explanation

When a Rank or Ability goal shows a level requirement (see `rank-level-progression`), the requirement display SHALL carry its own remaining text: "{{count}} levels" (remaining levels to the required level), with thousands separators. The text SHALL NOT include the raw XP figure; the XP still needed is represented by the XP-book chip of `goal-remaining-resources` and, in the progress explanation, by the Potential line. Where the requirement display has both an Actual and a Potential ratio to show, its explanation SHALL follow the disclosure behavior defined for the Actual/Potential captions, with the Actual line noting the remaining-levels figure (e.g. "6 levels remaining") and the Potential line noting the remaining-XP figure (e.g. "1,304,192 XP remaining").

#### Scenario: Requirement with a raw XP gap

- **GIVEN** a Rank goal's required level is 6 levels above the character's current level, and the raw xp gap to close it is 1,304,192
- **WHEN** the level requirement's remaining text renders
- **THEN** it reads "6 levels", with no XP segment

#### Scenario: Requirement already covered by total xp already gained

- **GIVEN** an Ability goal's required level is 2 levels above the character's current level, and the character's total xp already gained meets or exceeds that level's own threshold
- **WHEN** the level requirement's remaining text renders
- **THEN** it reads "2 levels", with no XP segment

#### Scenario: The requirement's explanation carries its own remaining-levels and remaining-XP figures

- **GIVEN** a Rank goal's level requirement has both an Actual Progress ratio and a Potential Progress ratio to show
- **WHEN** the user activates the "i" button
- **THEN** the Actual line notes the remaining-levels figure (e.g. "6 levels remaining") and the Potential line notes the remaining-XP figure (e.g. "1,304,192 XP remaining")
