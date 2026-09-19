## MODIFIED Requirements

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation

Wherever the goal progress display renders an Actual Progress ratio together with a Potential Progress ratio, an explanation of what each one measures SHALL be reachable without requiring a hover or other hidden-until-pointer interaction, but SHALL NOT be required to render unconditionally inline. On a viewport at or above the mobile breakpoint (see `goal-list-layout`), the explanation SHALL be exposed through an explicit "i" (info) trigger that opens a popover; below that breakpoint, tapping the goal's remaining-text line SHALL expand the explanation inline within the same card, with no separate popover. The Actual Progress line SHALL state that it reflects the player's currently synced/owned state, and note the underlying remaining-count figure (e.g. "9 upgrade slots remaining"). The Potential Progress line SHALL state that it reflects applying already-owned resources after this project's higher-priority goals reserve their share, that it does not change the goal's actual status, and note the underlying remaining-count figure (e.g. "1,674 energy remaining").

Assumptions:

- Today only Rank goals compute both an Actual and a Potential ratio at once (`computePotentialProgressRatio` only returns a value for Rank/Ability progress-slot allocation or Ascension orb allocation; Ability's own two-track display and Ascension's Potential path are out of scope for this change and keep today's rendering) — this requirement applies wherever both ratios are present, not only to Rank, so it extends automatically if a future goal kind also computes both.

#### Scenario: Both bars render in the compact goals list

- **GIVEN** a goal row in the goals list has both an Actual Progress ratio and a Potential Progress ratio to show, on a viewport at or above the mobile breakpoint
- **WHEN** the row renders
- **THEN** the row shows the stacked bar, the percent readout, and an "i" button, with neither explanation visible until the button is activated — reachable, not hover-only, but no longer unconditionally inline

#### Scenario: Both bars render on a project detail card

- **GIVEN** the same goal is shown on a project's detail page instead of the goals list, on a viewport at or above the mobile breakpoint
- **WHEN** the card renders
- **THEN** it shows the same "i"-triggered popover disclosure as the goals list, not a separate always-inline copy

#### Scenario: Both bars render in the goal-detail sheet

- **GIVEN** the same goal is opened in its detail sheet
- **WHEN** the sheet renders
- **THEN** the same disclosure behavior (popover at or above the mobile breakpoint, inline expand below it) applies, and the two explanation lines appear at most once each, never duplicated by a second, separate copy

#### Scenario: Desktop — activating the info trigger reveals both lines

- **GIVEN** a row or card from the two scenarios above, with its popover closed
- **WHEN** the user activates the "i" button
- **THEN** a popover opens showing the Actual line and the Potential line, each with its explanation text and remaining-count figure, and closes on a subsequent activation of the same button, an outside click, or Escape

#### Scenario: Mobile — both ratios present, explanation collapsed by default

- **GIVEN** the same goal renders as a card below the mobile breakpoint
- **WHEN** the card renders
- **THEN** the footer line shows the remaining-text figure and an info affordance, with the explanation collapsed

#### Scenario: Mobile — tapping the footer line expands the explanation inline

- **GIVEN** the card from the previous scenario
- **WHEN** the user taps the footer line
- **THEN** the same two explanation lines expand inline within the card body (not a floating popover), and collapse on a subsequent tap

#### Scenario: Only Actual Progress applies

- **GIVEN** a goal has no Potential Progress ratio to show (for example, no active project context supplies one)
- **WHEN** its progress renders
- **THEN** only the Actual Progress fill and percent render, with no info trigger, popover, or expand affordance — unchanged from today's single-ratio behavior

## ADDED Requirements

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

### Requirement: A Rank or Level goal's bar marks the ceiling currently reachable given rarity and level

For a Rank or Level goal, the character's current rarity and, for a Rank goal, current character level each independently cap how far the goal's own target scale can advance before the character Ascends or levels up further — a Rank goal is capped by whichever of the rarity ceiling and the level ceiling is lower. When that reachable ceiling falls short of the goal's target, the stacked bar SHALL render a marker at the ceiling's position on the track, distinct from the actual and potential fills, indicating the highest point on the bar currently reachable without further Ascension or leveling. When the reachable ceiling is at or past the target — nothing currently restricts the goal — no marker SHALL render.

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

#### Scenario: Level goal capped by rarity below its target

- **GIVEN** a Level goal targets a level above the character's current rarity's level cap
- **WHEN** its progress renders
- **THEN** the bar shows a ceiling marker at the position corresponding to that rarity's level cap

#### Scenario: No current restriction

- **GIVEN** a Rank or Level goal whose reachable ceiling (by rarity, and for Rank also by level) is at or past the goal's target
- **WHEN** its progress renders
- **THEN** no ceiling marker renders

### Requirement: Remaining resource text uses a per-goal-kind formatter with thousands separators

Wherever the goal progress display shows a still-needed resource count for a goal, it SHALL use one formatter per goal kind rather than a generic material/shard/orb breakdown: a Level goal SHALL show "{{count}} levels" (remaining levels to the target); a Rank goal SHALL show "{{slots}} slots · {{energy}} energy" (remaining upgrade slots and, when a farming energy estimate is available, the remaining energy); an Unlock goal SHALL show "{{shards}} shards" (remaining shard need, per `goal-farming-estimates`' zero-once-owned rule). Every number formatted by this requirement SHALL render with the locale's thousands separator.

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

#### Scenario: Level goal

- **GIVEN** a Level goal's target is 6 levels above the player's current level
- **WHEN** its remaining text renders
- **THEN** it reads "6 levels"

### Requirement: Remaining text stays reachable from the Progress column too

The remaining-text formatter output SHALL be reachable from the Progress column through a tooltip on the percent readout, for every goal kind, independently of whether the Remaining column is present and independently of whether that goal also has an Actual/Potential explanation popover. This applies even to a goal kind with no Potential ratio and no info trigger (for example, a Level goal), and to an Unlock goal, whose tooltip on the character's name (see the Unlock flavor-text requirement) SHALL show its own remaining-text figure alongside the flavor text rather than instead of it.

Assumptions:

- `goal-list-layout` keeps the Remaining column always visible on desktop (its own static-columns requirement), so this tooltip is a second, always-available path to the same figure rather than a fallback for a column that can disappear.

#### Scenario: A single-ratio goal (no popover)

- **GIVEN** a Level goal renders in the desktop table
- **WHEN** the user hovers or focuses its percent readout
- **THEN** a tooltip shows the Level goal's remaining-text figure (for example, "6 levels")

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
