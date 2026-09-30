# goal-list-estimate-display Specification

## Purpose

Defines how the Goals list (desktop table and mobile card view) presents each goal's computed completion estimate — the column label and the cell's date/day-count content — so the figure reads as a completion point rather than an ambiguous duration, without changing how the estimate itself is calculated.

## Requirements

### Requirement: The estimate column is labeled Done By

On the desktop Goals list, the computed estimate column SHALL be labeled "Done By". Mobile cards SHALL continue to show the same estimate content inline. Global Plan SHALL use plan-aware dates from the account-wide schedule without requiring a project selection.

#### Scenario: Desktop table header reads Done By

- **GIVEN** the Global Plan or Goals list renders with a plan-aware estimate
- **WHEN** the desktop table header renders
- **THEN** the estimate column reads Done By, not Est.

### Requirement: The Done By cell shows a formatted date and day count, with blocked detail in the indicator tooltip

For a successfully estimated goal, the Done By cell SHALL show a calendar icon, a short localized date, and an "in {{days}} days" caption from the same estimate result. Desktop and mobile presentations SHALL contain the same content. A Blocked goal SHALL show its blocked indicator and no date; the per-material detail of the block (each material with no supported source, its remaining quantity and the reason) SHALL be available in that indicator's tooltip, beneath the blocker reasons, and SHALL NOT render as visible lines in the cell or card. A goal with no computed estimate SHALL show the unavailable placeholder. A project filter SHALL show the goal's global-plan date, not a project-only recalculation. Dates retain `goal-farming-estimates`' inclusive Day-1 semantics and UTC-safe formatting.

#### Scenario: A goal 12 days from completion shows its date and day count

- **GIVEN** a goal's global estimate is 12 days with completion on September 28
- **WHEN** Done By renders on desktop or mobile
- **THEN** it shows a calendar icon and Sep 28 above "in 12 days"

#### Scenario: A blocked goal shows the indicator, with materials in its tooltip

- **GIVEN** a goal's estimate is Blocked because two materials have no supported source
- **WHEN** Done By renders on desktop or mobile
- **THEN** the cell shows the blocked indicator and no date or day count, no material line is visible, and the indicator's tooltip lists both materials with their remaining quantity and reason after the blocker reasons

#### Scenario: A goal with no estimate is unaffected

- **WHEN** no estimate exists because the goal is non-farmable or planning data is unavailable
- **THEN** Done By shows the unavailable placeholder, not a fabricated date
