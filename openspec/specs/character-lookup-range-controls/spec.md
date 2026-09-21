# character-lookup-range-controls Specification

## Purpose

Defines how a user manually edits the Character Lookup rank range after it
has been established (by default derivation, a shared URL, or a prior
edit): which start/end values the controls let them reach, and how the
range stays strictly valid — start below end, both within the currently
reachable ladder — while they do.

## Requirements

### Requirement: Rank-range start and end controls offer the full reachable ladder

The rank-range start and end controls SHALL each offer every rank from the
first rank through the current maximum reachable rank as a selectable
value, without pre-filtering out ranks based on the range's other current
value. Selecting a value SHALL always resolve to a range where the start
rank is strictly below the end rank — never equal, never inverted — by
adjusting the side the user did not select, rather than the control
silently refusing to offer a value or producing an invalid range.

#### Scenario: Start can be raised to or above the current end

- **GIVEN** a rank range with a given start and end, and the new start is
  below the ladder's maximum rank
- **WHEN** the user picks a start value at or above the current end from the
  start control's own option list
- **THEN** the start control offers that value as a selectable option, and
  the end auto-advances to exactly one rank above the new start

#### Scenario: Start is raised to the ladder's maximum rank

- **GIVEN** a rank range below the ladder's maximum
- **WHEN** the user picks the maximum rank as the start value
- **THEN** the start control offers that value, and the range resolves to
  start at the second-to-last rank and end at the maximum rank — not to
  start equal to end

#### Scenario: End can be lowered to or below the current start

- **GIVEN** a rank range with a given start and end, and the new end is
  above the ladder's minimum rank
- **WHEN** the user picks an end value at or below the current start from
  the end control's own option list
- **THEN** the end control offers that value as a selectable option, and
  the start auto-retreats to exactly one rank below the new end

#### Scenario: End is lowered to the ladder's minimum rank

- **GIVEN** a rank range above the ladder's minimum
- **WHEN** the user picks the minimum rank as the end value
- **THEN** the end control offers that value, and the range resolves to
  start at the minimum rank and end at the second rank — not to start
  equal to end

#### Scenario: Options are capped at the current maximum reachable rank

- **GIVEN** a maximum reachable rank determined by the game's current rank
  ladder
- **WHEN** the rank-range controls render their option lists
- **THEN** neither control offers a rank beyond that maximum

### Requirement: Desktop and mobile rank-range editing stay consistent

The desktop and mobile Character Lookup rank-range controls SHALL apply the
same auto-advance/auto-retreat behavior, including at the ladder's ceiling
and floor, to a range edit, so a value reachable on one control resolves
identically on the other.

#### Scenario: Same reachable range on both layouts

- **GIVEN** the same character and applied rank range
- **WHEN** the page is rendered at a viewport below the mobile breakpoint and
  at one at or above it
- **THEN** both layouts let the user reach the same set of valid start/end
  combinations for that range, including the same ceiling/floor resolution
