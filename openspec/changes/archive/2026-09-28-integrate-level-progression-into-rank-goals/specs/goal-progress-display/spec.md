## REMOVED Requirements

### Requirement: Level goal Potential progress reflects owned XP books, shared by priority

**Reason**: Level goals no longer exist in the client. Owned XP books' Potential progress toward a required level is now ordinary progress on the Rank or Ability goal that needs the level, and the shared, priority-ordered allocation of books is owned by `rank-level-progression`'s "Level XP is counted once across a unit's targets".

**Migration**: Use `rank-level-progression`. The no-project-context rule is unchanged: with no project context, no goal kind supplies a Potential ratio.

### Requirement: A Rank or Level goal's bar marks the ceiling currently reachable given rarity and level

**Reason**: Level goals no longer exist in the client, so the Level clause and scenario are dropped. The rarity-cap ceiling for a level target now applies to a Rank or Ability goal's level-requirement bar, covered by the renamed requirement below.

**Migration**: Use "A Rank goal's bar marks the ceiling currently reachable given rarity and level, and its level-requirement bar marks the rarity cap".

### Requirement: Displayed current value never reads past the goal's own target

**Reason**: Level goals no longer exist in the client, so this requirement's Level clauses and scenarios are dropped. Requirements that are otherwise unchanged carry over verbatim under the renamed requirement below; the level requirement's own display is covered by "A Rank or Ability goal's level requirement carries its own remaining text and explanation".

**Migration**: Use "A Rank or Ascension goal's displayed current value never reads past its own target".

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation

**Reason**: Level goals no longer exist in the client, so this requirement's Level clauses and scenarios are dropped. Requirements that are otherwise unchanged carry over verbatim under the renamed requirement below; the level requirement's own display is covered by "A Rank or Ability goal's level requirement carries its own remaining text and explanation".

**Migration**: Use "Actual Progress and Potential Progress captions carry a visible explanation on every goal kind".

### Requirement: Remaining resource text uses a per-goal-kind formatter with thousands separators

**Reason**: Level goals no longer exist in the client, so this requirement's Level clauses and scenarios are dropped. Requirements that are otherwise unchanged carry over verbatim under the renamed requirement below; the level requirement's own display is covered by "A Rank or Ability goal's level requirement carries its own remaining text and explanation".

**Migration**: Use "Remaining resource text uses a per-goal-kind formatter for Rank and Unlock goals with thousands separators".

## ADDED Requirements

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

Wherever the goal progress display renders an Actual Progress ratio together with a Potential Progress ratio, an explanation of what each one measures SHALL be reachable without requiring a hover or other hidden-until-pointer interaction, but SHALL NOT be required to render unconditionally inline. On a viewport at or above the mobile breakpoint (see `goal-list-layout`), the explanation SHALL be exposed through an explicit "i" (info) trigger that opens a popover; below that breakpoint, tapping the goal's remaining-text line SHALL expand the explanation inline within the same card, with no separate popover. The Actual Progress line SHALL state that it reflects the player's currently synced/owned state, and note the underlying remaining-count figure (e.g. "9 upgrade slots remaining" for a Rank goal). The Potential Progress line SHALL state that it reflects applying already-owned resources after this project's higher-priority goals reserve their share, that it does not change the goal's actual status, and note the underlying remaining-count figure (e.g. "1,674 energy remaining" for a Rank goal).

Assumptions:

- Rank, Ability, and Ascension goals each compute both an Actual and a Potential ratio at once, given a project context (`computePotentialProgressRatio` for Rank/Ability progress-slot allocation and Ascension orb allocation); the level-requirement display on a Rank or Ability goal computes both as well, from the XP-book allocation in `rank-level-progression` — this requirement applies wherever both ratios are present, so it extends automatically if a future goal kind also computes both.

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

## MODIFIED Requirements

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
