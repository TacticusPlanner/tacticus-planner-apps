## MODIFIED Requirements

### Requirement: Progress renders as one stacked bar with an actual fill over a potential fill

A goal's progress (Actual Progress and, when applicable, Potential Progress) SHALL render as a single bar with up to two layers over a track: a striped fill from 0 to the Potential Progress ratio (when present and greater than the Actual Progress ratio), and a solid fill from 0 to the Actual Progress ratio on top of it. Both ratios SHALL be clamped to the 0–100% range before rendering. When no Potential Progress ratio is present, or it is not greater than the Actual Progress ratio, only the solid actual fill SHALL render (no striped layer).

#### Scenario: Actual progress with no potential data

- **GIVEN** a goal has only an Actual Progress ratio of 0.55 (55%)
- **WHEN** its progress renders
- **THEN** the bar shows only a solid fill covering 55% of the track, with no striped layer

#### Scenario: Potential exceeds actual

- **GIVEN** a goal has an Actual Progress ratio of 0.25 (25%) and a Potential Progress ratio of 0.47 (47%)
- **WHEN** its progress renders
- **THEN** the bar shows a striped fill covering 47% of the track with a solid fill covering the first 25% on top of it

#### Scenario: Potential at or below actual

- **GIVEN** a goal has an Actual Progress ratio of 0.60 (60%) and a Potential Progress ratio of 0.60 or less
- **WHEN** its progress renders
- **THEN** the bar shows only the solid actual fill, with no visible striped layer (the potential fill would be fully covered)

#### Scenario: Actual progress at zero with potential above zero

- **GIVEN** a goal has an Actual Progress ratio of 0 and a Potential Progress ratio of 0.82 (82%)
- **WHEN** its progress renders
- **THEN** the bar shows only the striped potential fill covering 82% of the track; the solid actual fill renders at zero width (not visible)

#### Scenario: Fully complete

- **GIVEN** a goal has an Actual Progress ratio of 1 (100%)
- **WHEN** its progress renders
- **THEN** the bar shows the solid fill covering the full track

### Requirement: The Unlock goal's flavor text moves from an inline row caption to a name tooltip

The Unlock goal's descriptive caption ("Gather the character's shards and prepare them to join your roster.") SHALL NOT render as a persistent line under the goal row/card; it SHALL be available as a tooltip on the character's name, shown on hover or keyboard focus (desktop) or on tap (mobile), consistent with this app's shared `Tooltip` component's existing touch behavior.

#### Scenario: Desktop hover reveals the flavor text

- **GIVEN** an Unlock goal row on a viewport at or above the mobile breakpoint
- **WHEN** the user hovers the character's name
- **THEN** a tooltip shows the flavor text, and no separate caption line renders under the row by default

#### Scenario: No persistent caption line

- **GIVEN** the same Unlock goal row
- **WHEN** the row renders without any hover/tap interaction
- **THEN** no flavor-text line renders under the character name

### Requirement: A Rank or Ascension goal's displayed current value never reads past its own target

For a Rank or Ascension goal, the current value shown alongside the goal's target SHALL never represent progression beyond that goal's own configured target, even when the player's actual synced progression has advanced past it. The displayed current SHALL be the lesser of the player's actual progression and the goal's target; the completion ratio SHALL read 100% whenever the player's actual progression is at or past the target.

This is an upper bound only. When the player's actual progression is below the goal's configured target, the displayed current SHALL be the player's true, actual progression — it SHALL NOT be raised toward the goal's configured start under any circumstance, including when actual progression is below that start.

Assumptions:

- Rank and Ascension goals each carry a configured target (`Rank` or `Progression` respectively) that is comparable to the player's synced current value on the same ordered scale.

#### Scenario: Live progression has reached the goal's target exactly

- **GIVEN** an Ascension goal configured with a target of `Rare:FiveStars` and the player's character has ascended to exactly `Rare:FiveStars`
- **WHEN** the goal's progress is displayed
- **THEN** both the current and target badges show `Rare:FiveStars` and the progress bar reads 100%

#### Scenario: Live progression has advanced past the goal's target

- **GIVEN** an Ascension goal configured with a target of `Rare:FiveStars` and the player's character has since ascended further, to `Epic:RedOneStar`
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows `Rare:FiveStars` (clamped to the target), not `Epic:RedOneStar`, and the progress bar reads 100%

#### Scenario: A Rank goal's live rank has advanced past its target

- **GIVEN** a Rank goal configured with a target rank of `Diamond1` and the player's character has since ranked up to `Diamond3`
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows `Diamond1` (clamped to the target), not `Diamond3`, and the progress bar reads 100%

#### Scenario: Live progression has not yet reached the goal's target

- **GIVEN** an Ascension goal configured with a target of `Rare:FiveStars` and the player's character is currently at `Uncommon:FourStars`
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows `Uncommon:FourStars` unchanged and the progress bar reads proportionally between 0% and 100%

#### Scenario: Live progression is below the goal's configured start

- **GIVEN** an Ascension goal configured with a start of `Uncommon:FourStars` and a target of `Rare:FiveStars`, and the player's character is currently at `Common:TwoStars` — below the configured start
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows the player's true `Common:TwoStars`, not raised to `Uncommon:FourStars`
