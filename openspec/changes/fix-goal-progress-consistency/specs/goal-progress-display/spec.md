## Purpose

Defines how a goal's current and target state, and its completion ratio, are derived for on-screen display, and how the Actual Progress and Potential Progress readouts are captioned so a viewer can tell what each one measures without hovering or opening another view.

## ADDED Requirements

### Requirement: Displayed current value never reads past the goal's own target

For a Rank, Ascension, or Level goal, the current value shown alongside the goal's target SHALL never represent progression beyond that goal's own configured target, even when the player's actual synced progression has advanced past it. The displayed current SHALL be the lesser of the player's actual progression and the goal's target; the completion ratio SHALL read 100% whenever the player's actual progression is at or past the target.

This is an upper bound only. When the player's actual progression is below the goal's configured target, the displayed current SHALL be the player's true, actual progression — it SHALL NOT be raised toward the goal's configured start under any circumstance, including when actual progression is below that start.

Assumptions:

- Rank, Ascension, and Level goals each carry a configured target (`Rank`, `Progression`, or level number respectively) that is comparable to the player's synced current value on the same ordered scale.

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

#### Scenario: A Level goal's live level has advanced past its target

- **GIVEN** a Level goal configured with a target level of `50` and the player's character is now level `62`
- **WHEN** the goal's progress is displayed
- **THEN** the displayed current level is `50`, not `62`, and the progress bar reads 100%

#### Scenario: Live progression has not yet reached the goal's target

- **GIVEN** an Ascension goal configured with a target of `Rare:FiveStars` and the player's character is currently at `Uncommon:FourStars`
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows `Uncommon:FourStars` unchanged and the progress bar reads proportionally between 0% and 100%, unchanged from today

#### Scenario: Live progression is below the goal's configured start

- **GIVEN** an Ascension goal configured with a start of `Uncommon:FourStars` and a target of `Rare:FiveStars`, and the player's character is currently at `Common:TwoStars` — below the configured start
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows the player's true `Common:TwoStars`, not raised to `Uncommon:FourStars`

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation

Wherever the goal progress display renders an Actual Progress bar together with a Potential Progress bar, each caption SHALL be accompanied by a short, always-visible explanation of what it measures — visible without a hover or other hidden interaction. The Actual Progress explanation SHALL state that it reflects the player's currently synced/owned state. The Potential Progress explanation SHALL state that it reflects applying already-owned resources after this project's higher-priority goals reserve their share, and that it does not change the goal's actual status.

#### Scenario: Both bars render in the compact goals list

- **GIVEN** a goal row in the goals list has both an Actual Progress ratio and a Potential Progress ratio to show
- **WHEN** the row renders
- **THEN** both captions display their explanation text inline, without requiring the user to hover or open the goal's detail view

#### Scenario: Both bars render on a project detail card

- **GIVEN** the same goal is shown on a project's detail page instead of the goals list
- **WHEN** the card renders
- **THEN** both captions display the same explanation text inline as in the goals list

#### Scenario: Both bars render in the goal-detail sheet

- **GIVEN** the same goal is opened in its detail sheet
- **WHEN** the sheet renders
- **THEN** the same two explanations each appear exactly once, not duplicated by a second, separate copy of the Potential Progress explanation

#### Scenario: Only Actual Progress applies

- **GIVEN** a goal has no Potential Progress ratio to show (for example, no active project context supplies one)
- **WHEN** its progress renders
- **THEN** only the Actual Progress bar renders, with no Potential Progress caption or explanation, unchanged from today's single-bar behavior

### Requirement: Progress readouts do not imply partial progress is uniformly valuable

The Actual Progress and Potential Progress explanations SHALL state only what each ratio measures relative to the goal's own configured target. Neither explanation SHALL state or imply that partial progress toward a target carries player value proportional to, or equivalent to, reaching the target itself.

#### Scenario: Copy does not claim general usefulness

- **GIVEN** the Actual Progress and Potential Progress explanations as displayed
- **WHEN** a user reads them
- **THEN** neither explanation states or implies that reaching partway to the target provides value equivalent to reaching the target itself
