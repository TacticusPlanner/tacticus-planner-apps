# goal-progress-display Specification

## Purpose

Defines how a goal's current and target state, and its completion ratio, are derived for on-screen display, and how the Actual Progress and Potential Progress readouts are captioned so a viewer can tell what each one measures without hovering or opening another view.

## Requirements

### Requirement: Progress readouts do not imply partial progress is uniformly valuable

The Actual Progress and Potential Progress explanations SHALL state only what each ratio measures relative to the goal's own configured target. Neither explanation SHALL state or imply that partial progress toward a target carries player value proportional to, or equivalent to, reaching the target itself.

#### Scenario: Copy does not claim general usefulness

- **GIVEN** the Actual Progress and Potential Progress explanations as displayed
- **WHEN** a user reads them
- **THEN** neither explanation states or implies that reaching partway to the target provides value equivalent to reaching the target itself

### Requirement: Progress renders as one stacked bar with an actual fill over a potential fill

Wherever a goal's progress previously rendered as two separate progress bars (an Actual Progress bar and, when applicable, a Potential Progress bar), it SHALL instead render as a single bar with up to two layers over a track: a striped fill from 0 to the Potential Progress ratio (when present and greater than the Actual Progress ratio), and a solid fill from 0 to the Actual Progress ratio on top of it. Both ratios SHALL be clamped to the 0–100% range before rendering. When no Potential Progress ratio is present, or it is not greater than the Actual Progress ratio, only the solid actual fill SHALL render (no striped layer).

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

### Requirement: Progress renders a percent readout, with a potential indicator when higher

Next to the stacked bar, the Actual Progress ratio SHALL render as a rounded whole-number percentage using tabular (fixed-width) digit rendering. When a Potential Progress ratio is present and greater than the Actual Progress ratio, a second, smaller line SHALL render beneath the percent showing the Potential Progress ratio as a percentage, prefixed with an indicator that it represents additional, not-yet-actual progress (for example, "↗ 47%"). When no Potential Progress ratio is present, or it is not greater than the Actual Progress ratio, only the Actual Progress percentage SHALL render.

The rendered percentage SHALL read "100%" only once the underlying ratio has truly reached 1. Naive rounding to the nearest whole percent would read a ratio like 0.996 (for example, 498 of 500 shards) as "100%" while a still-nonzero remaining-count figure renders alongside it, which contradicts that figure. Any ratio below 1 SHALL round to at most 99%, even where ordinary rounding would round up to 100.

#### Scenario: Potential exceeds actual

- **GIVEN** a goal has an Actual Progress ratio of 0.25 and a Potential Progress ratio of 0.47
- **WHEN** its progress renders
- **THEN** "25%" renders as the primary readout with "↗ 47%" beneath it

#### Scenario: No potential, or potential not above actual

- **GIVEN** a goal has only an Actual Progress ratio, or a Potential Progress ratio at or below the Actual Progress ratio
- **WHEN** its progress renders
- **THEN** only the Actual Progress percentage renders, with no second line

#### Scenario: A near-complete ratio does not round up to a premature 100%

- **GIVEN** a goal has an Actual Progress ratio of 0.996 (498 of 500 shards owned) and a remaining-count figure of "2 shards"
- **WHEN** its progress renders
- **THEN** the percent readout shows "99%", not "100%" — consistent with the still-nonzero remaining count

#### Scenario: A truly complete ratio still shows 100%

- **GIVEN** a goal has an Actual Progress ratio of exactly 1 (500 of 500 shards owned)
- **WHEN** its progress renders
- **THEN** the percent readout shows "100%"

### Requirement: Remaining text stays reachable from the Progress column too

The remaining-text formatter output SHALL be reachable from the Progress column through a tooltip on the percent readout, for every goal kind, independently of whether the Remaining column is present and independently of whether that goal also has an Actual/Potential explanation popover. This applies even to a goal with no Potential ratio and no info trigger (for example, a Rank goal shown with no project context), and to an Unlock goal, whose tooltip on the character's name (see the Unlock flavor-text requirement) SHALL show its own remaining-text figure alongside the flavor text rather than instead of it.

Assumptions:

- `goal-list-layout` keeps the Remaining column always visible on desktop (its own static-columns requirement), so this tooltip is a second, always-available path to the same figure rather than a fallback for a column that can disappear.

#### Scenario: A single-ratio goal (no popover)

- **GIVEN** a Rank goal with no Potential ratio renders in the desktop table
- **WHEN** the user hovers or focuses its percent readout
- **THEN** a tooltip shows the Rank goal's remaining-text figure (for example, "9 slots")

#### Scenario: An Unlock goal

- **GIVEN** an Unlock goal renders in the desktop table
- **WHEN** the user hovers or focuses the character's name
- **THEN** the tooltip shows both the flavor text and the Unlock goal's remaining shard count

### Requirement: The Unlock goal's flavor text moves from an inline row caption to a name tooltip

The Unlock goal's descriptive caption ("Gather the character's shards and prepare them to join your roster.") SHALL no longer render as a persistent line under the goal row/card. It SHALL instead be available as a tooltip on the character's name, shown on hover or keyboard focus (desktop) or on tap (mobile), consistent with this app's shared `Tooltip` component's existing touch behavior.

#### Scenario: Desktop hover reveals the flavor text

- **GIVEN** an Unlock goal row on a viewport at or above the mobile breakpoint
- **WHEN** the user hovers the character's name
- **THEN** a tooltip shows the flavor text, and no separate caption line renders under the row by default

#### Scenario: No persistent caption line

- **GIVEN** the same Unlock goal row
- **WHEN** the row renders without any hover/tap interaction
- **THEN** no flavor-text line renders under the character name

### Requirement: A Rank goal's bar marks the ceiling currently reachable given rarity and level, and its level-requirement bar marks the rarity cap

For a Rank goal, the character's current rarity and current character level each independently cap how far the goal's own target scale can advance before the character Ascends or levels up further — a Rank goal is capped by whichever of the rarity ceiling and the level ceiling is lower. When that reachable ceiling falls short of the goal's target, the stacked bar SHALL render a marker at the ceiling's position on the track, distinct from the actual and potential fills, indicating the highest point on the bar currently reachable without further Ascension or leveling. When the reachable ceiling is at or past the target — nothing currently restricts the goal — no marker SHALL render.

The level-requirement bar a Rank or Ability goal shows when its character is below the required level (see `rank-level-progression`) SHALL likewise render a ceiling marker at the character's current rarity's level cap whenever the required level is above that cap, and no marker otherwise.

The marker is a supplementary visual cue, not a replacement for the "Restricted" indicator `goal-blocker-reasons` defines for the same underlying condition; the two SHALL be able to appear together (the indicator naming that the goal is restricted, the marker showing how far it can currently go).

#### Scenario: Rank goal capped by rarity below its target

- **GIVEN** a Rank goal targets Gold1 but the character's current rarity only permits ranking up to Silver1
- **WHEN** its progress renders
- **THEN** the bar shows a ceiling marker at the position corresponding to Silver1, short of the Gold1 target end

#### Scenario: Rank goal capped by level below its target

- **GIVEN** a Rank goal's rarity ceiling is at or past the target, but the character's current level only permits ranking up to a lower rank than the target
- **WHEN** its progress renders
- **THEN** the bar shows a ceiling marker at the position corresponding to the level-capped rank, not the rarity ceiling

#### Scenario: Rank goal capped by both rarity and level at the same point

- **GIVEN** a Rank goal's rarity ceiling and level ceiling both cap the goal at the same rank, short of the target
- **WHEN** its progress renders
- **THEN** the bar shows a single ceiling marker at that shared rank's position

#### Scenario: Level-requirement bar capped by rarity below the required level

- **GIVEN** a Rank or Ability goal shows a level requirement above the character's current rarity's level cap
- **WHEN** its level-requirement bar renders
- **THEN** the bar shows a ceiling marker at the position corresponding to that rarity's level cap

#### Scenario: No current restriction

- **GIVEN** a Rank goal whose reachable ceiling (by rarity and by level) is at or past the goal's target, or a level-requirement bar whose required level is at or below the rarity's level cap
- **WHEN** its progress renders
- **THEN** no ceiling marker renders

### Requirement: A Rank or Ability goal's level requirement carries its own remaining text and explanation

When a Rank or Ability goal shows a level requirement (see `rank-level-progression`), the requirement display SHALL carry its own remaining text, separate from the goal's own remaining-text formatter: "{{count}} levels" (remaining levels to the required level) or, when the raw XP still needed to close that gap is nonzero, "{{count}} levels · {{xp}} XP", with thousands separators. The XP figure is the gap between the required level's own total-XP threshold and the character's true total XP already gained (the real Tacticus API's `xp` field — "total XP gained for character", not a per-level-reset partial amount); it is NOT netted against owned XP books, and is omitted (not shown as "0 XP") whenever the character's total XP already gained meets or exceeds that threshold. Where the requirement display has both an Actual and a Potential ratio to show, its explanation SHALL follow the disclosure behavior defined for the Actual/Potential captions, with the Actual line noting the remaining-levels figure (e.g. "6 levels remaining") and the Potential line noting the remaining-XP figure (e.g. "1,304,192 XP remaining").

#### Scenario: Requirement with a raw XP gap

- **GIVEN** a Rank goal's required level is 6 levels above the character's current level, and the raw xp gap to close it is 1,304,192
- **WHEN** the level requirement's remaining text renders
- **THEN** it reads "6 levels · 1,304,192 XP"

#### Scenario: Requirement already covered by total xp already gained

- **GIVEN** an Ability goal's required level is 2 levels above the character's current level, and the character's total xp already gained meets or exceeds that level's own threshold
- **WHEN** the level requirement's remaining text renders
- **THEN** it reads "2 levels", with no XP segment

#### Scenario: The requirement's explanation carries its own remaining-levels and remaining-XP figures

- **GIVEN** a Rank goal's level requirement has both an Actual Progress ratio and a Potential Progress ratio to show
- **WHEN** the user activates the "i" button
- **THEN** the Actual line notes the remaining-levels figure (e.g. "6 levels remaining") and the Potential line notes the remaining-XP figure (e.g. "1,304,192 XP remaining")

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
- **THEN** the current badge shows `Uncommon:FourStars` unchanged and the progress bar reads proportionally between 0% and 100%, unchanged from today

#### Scenario: Live progression is below the goal's configured start

- **GIVEN** an Ascension goal configured with a start of `Uncommon:FourStars` and a target of `Rare:FiveStars`, and the player's character is currently at `Common:TwoStars` — below the configured start
- **WHEN** the goal's progress is displayed
- **THEN** the current badge shows the player's true `Common:TwoStars`, not raised to `Uncommon:FourStars`

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation on every goal kind

Where Actual and Potential ratios render together, their explanation SHALL be reachable without hover. At or above 768px it SHALL use an explicit info-triggered popover; below 768px tapping the remaining-text line SHALL expand it inline. Actual SHALL describe synced/owned state and its remaining count. Potential SHALL describe applying owned resources after globally higher-priority Active goals reserve their share, state that it does not change actual status, and show its remaining count. The explanation SHALL not describe a selected project as a separate allocation pool. The same disclosure applies in goal list, project detail, and goal detail, at most once per ratio. With no Potential ratio, only Actual appears and no explanation trigger is required.

#### Scenario: Both bars render in the compact goals list

- **WHEN** a desktop goal row has Actual and Potential ratios
- **THEN** its stacked bar, percent, and info button render with explanations hidden until activation

#### Scenario: Both bars render on a project detail card

- **WHEN** a desktop project goal has both ratios
- **THEN** it uses the same info disclosure and global-priority explanation as Global Plan

#### Scenario: Both bars render in the goal-detail sheet

- **WHEN** goal detail has both ratios
- **THEN** the breakpoint-appropriate disclosure appears once, without duplicate explanation lines

#### Scenario: Desktop — activating the info trigger reveals both lines

- **WHEN** the desktop info button is activated
- **THEN** a popover shows both explanations and remaining counts and closes on repeat activation, outside click, or Escape

#### Scenario: Mobile — both ratios present, explanation collapsed by default

- **WHEN** a mobile goal card has both ratios
- **THEN** its footer shows remaining text and an info affordance, collapsed initially

#### Scenario: Mobile — tapping the footer line expands the explanation inline

- **WHEN** the mobile footer is tapped
- **THEN** both explanation lines expand within the card and collapse on a second tap

#### Scenario: Only Actual Progress applies

- **WHEN** no Potential ratio is available because planning inputs are unavailable
- **THEN** only Actual fill and percent render, without an info trigger or invented Potential value

### Requirement: Remaining resource text uses a per-goal-kind formatter for Rank and Unlock goals with thousands separators

Wherever the goal progress display shows a still-needed resource count for a goal, it SHALL use one formatter per goal kind rather than a generic material/shard/orb breakdown: a Rank goal SHALL show "{{slots}} slots · {{energy}} energy" (remaining upgrade slots and, when a farming energy estimate is available, the remaining energy); an Unlock goal SHALL show "{{shards}} shards" (remaining shard need, per `goal-farming-estimates`' zero-once-owned rule). The level requirement a Rank or Ability goal shows keeps its own remaining text ("{{count}} levels" or "{{count}} levels · {{xp}} XP", see "A Rank or Ability goal's level requirement carries its own remaining text and explanation"), rendered beneath the goal's own remaining text rather than replacing it. Every number formatted by this requirement SHALL render with the locale's thousands separator.

Assumptions:

- This requirement only changes how an already-computed remaining count is formatted for display; it does not change any calculation in `goal-farming-estimates` or `computeGoalProgress`.
- A Rank goal with no farming energy estimate available (for example, no project context) SHALL show only the slots figure ("{{slots}} slots"), omitting the "· {{energy}} energy" segment rather than showing a placeholder.

#### Scenario: Rank goal with both slots and energy available

- **GIVEN** a Rank goal has 9 upgrade slots remaining and a farming estimate of 1,674 remaining energy
- **WHEN** its remaining text renders
- **THEN** it reads "9 slots · 1,674 energy"

#### Scenario: Unlock goal

- **GIVEN** an Unlock goal has 227 shards remaining
- **WHEN** its remaining text renders
- **THEN** it reads "227 shards"
