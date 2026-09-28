## REMOVED Requirements

### Requirement: A Level goal with exactly one dependent renders as that goal's sub-line, not its own row

**Reason**: Level goals no longer exist in the client, so there is no Level goal to fold into a dependent's row or card. The level a Rank or Ability goal needs is instead displayed as sub-lines of that goal's own row or card (see the added requirement below and `rank-level-progression`).

**Migration**: None on the client; the Level goal's remaining-progress display is now the Rank or Ability goal's own required-level display.

### Requirement: Mobile renders one card per goal

**Reason**: The one-card-per-goal rule no longer has a sub-line exception and the "A merged Level goal does not render its own card" scenario no longer applies, since Level goals do not exist. The rule carries over, with the level requirement rendered inside its Rank or Ability goal's own card, under the renamed requirement below.

**Migration**: Use "Mobile renders one card per goal, with any level requirement inside it".

## ADDED Requirements

### Requirement: Mobile renders one card per goal, with any level requirement inside it

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s), the primary pause/resume control (see `goal-status-actions`'s "Pause and resume are primary row actions"), and the "⋯" row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

A Rank or Ability goal whose character is below its required level SHALL additionally render that level requirement inside its own card as sub-lines beneath the goal's own content (see "A Rank or Ability goal shows its level requirement as sub-lines of its own row or card"); it never renders as a separate card.

#### Scenario: Card with a completion estimate

- **GIVEN** a Rank goal has a computed completion estimate of September 27th (in 9 days)
- **WHEN** its card renders
- **THEN** the header caption reads "Rank · 📅 Sep 27 · 9 days"

#### Scenario: Card with no completion estimate

- **GIVEN** a goal has no computed completion estimate
- **WHEN** its card renders
- **THEN** the header caption reads only the goal type (for example, "Unlock"), with no date segment

#### Scenario: A Rank goal below its required level shows the requirement inside its own card

- **GIVEN** a Rank goal whose character is below the level its target needs
- **WHEN** the mobile card list renders
- **THEN** exactly one card exists for the goal and the level requirement appears as sub-lines within that card, with no separate card for it

#### Scenario: The primary pause/resume control appears in the card header, same as desktop

- **GIVEN** an Active goal renders once as a desktop table row and once as a mobile card
- **WHEN** each renders
- **THEN** both show the same primary pause control, reachable without opening the "⋯" menu — the mobile card places it in the header alongside the status label(s) and the "⋯" menu, matching the desktop Actions column's placement

### Requirement: A Rank or Ability goal shows its level requirement as sub-lines of its own row or card

Wherever the Goals list renders (desktop table or mobile cards, on either the Goals Overview or a project detail route), a Rank or Ability goal whose character is below the level its target needs SHALL render that requirement as sub-lines nested under the goal's own cells or card body, using the level-requirement display defined by `rank-level-progression`: a target line "Lv {{current}} → {{required}}" under the Goal cell, a Potential-only progress bar (owned XP books' reach, with no Actual fill because Actual level has not reached the requirement) under the Progress cell, and remaining text "{{levels}} levels · {{xp}} XP" under the Remaining cell. The requirement SHALL never render as its own row or card, and SHALL NOT be rendered as a separate goal, a dependency, or a Restricted reason. When the character is at or above the required level, or the goal is not a Character Rank or Ability goal, no requirement sub-lines SHALL render.

#### Scenario: Desktop Rank row below its required level

- **GIVEN** a Rank goal whose character is at level 30 and whose target requires level 32
- **WHEN** the desktop table renders
- **THEN** exactly one row exists for the goal, and its Goal cell shows the target line "Lv 30 → 32", its Progress cell shows a Potential-only bar, and its Remaining cell shows "{{levels}} levels · {{xp}} XP" as sub-lines beneath the goal's own content

#### Scenario: Mobile card below its required level

- **GIVEN** an Ability goal whose character is below the level its target implies
- **WHEN** the mobile card list renders
- **THEN** the card shows the same target line, Potential-only bar, and remaining text as sub-lines within the Ability goal's own card body

#### Scenario: Level requirement is met

- **GIVEN** a Rank goal whose character is at or above the level its target needs
- **WHEN** the list renders on desktop or mobile
- **THEN** no requirement sub-lines appear for that goal

#### Scenario: A goal that is not a Character Rank or Ability goal

- **GIVEN** an Unlock, Ascension, Upgrade, or Machine-of-War goal
- **WHEN** the list renders
- **THEN** no requirement sub-lines appear for that goal

## MODIFIED Requirements

### Requirement: The Actual/Potential legend renders once per list, only when relevant, not per row

When at least one visible goal has both an Actual and a Potential ratio to show, the "Actual" / "Potential" swatch legend SHALL render exactly once per list: in the Progress column's header on the desktop table, and at the top of the list above the first card on mobile. It SHALL NOT repeat per row or per card, replacing today's per-row "Actual progress" / "Potential progress" caption labels (moved into `goal-progress-display`'s on-demand explanation). When no visible goal has a Potential ratio, the legend SHALL NOT render at all, since it would have nothing to distinguish.

#### Scenario: Desktop table with multiple goals showing both ratios

- **GIVEN** the Goals list renders three Rank goal rows, each with both an Actual and a Potential ratio
- **WHEN** the table renders
- **THEN** the legend appears once, in the Progress column header, and no row repeats it

#### Scenario: Mobile list with multiple goals showing both ratios

- **GIVEN** the same three goals render as cards
- **WHEN** the list renders
- **THEN** the legend appears once, above the first card, and no card repeats it

#### Scenario: No goal in the list has a Potential ratio

- **GIVEN** the Goals list renders only Unlock goals, which never compute a Potential ratio
- **WHEN** the list renders, on either desktop or mobile
- **THEN** no legend renders
