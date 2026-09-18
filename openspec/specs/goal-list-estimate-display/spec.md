# goal-list-estimate-display Specification

## Purpose

Defines how the Goals list (desktop table and mobile card view) presents each goal's computed completion estimate — the column label and the cell's date/day-count content — so the figure reads as a completion point rather than an ambiguous duration, without changing how the estimate itself is calculated.

## Requirements

### Requirement: The estimate column is labeled Done By

On the desktop Goals list table, the column showing each goal's computed estimate SHALL be labeled "Done By" rather than "Est.". The mobile card view SHALL continue to render the same estimate content inline (it has no column header to rename).

Assumptions this requirement depends on: this label change applies only to the Goals list column; the goal-detail sheet's separate "Estimate" section is a different display of a different (sometimes isolated, priority-unaware) figure and is unaffected — see "goal-farming-estimates" for the estimate computation this reads from, unchanged by this capability.

#### Scenario: Desktop table header reads Done By

- **GIVEN** the Goals list is rendered on desktop with a project selected (estimates available)
- **WHEN** the table header row renders
- **THEN** the estimate column's header text is "Done By", not "Est."

### Requirement: The Done By cell shows a formatted date and day count

For a goal with a successfully computed (non-blocked) estimate, the Done By cell SHALL show, in this order: a calendar icon, a short formatted completion date, and an "in {{days}} days" caption beneath it — using the same `energyTotal`-adjacent `date`/`days` values the estimate already computes (no new calculation). This two-line presentation SHALL be identical on the desktop table and the mobile card view; there is no compact or single-line mobile variant.

A goal whose estimate status is Blocked, and a goal with no computed estimate at all (no project selected, non-farmable goal type, or estimates not requested for this view), SHALL continue to render exactly as they do today — this requirement changes only the successfully-estimated case's presentation.

Assumptions this requirement depends on: the estimate's `date` is anchored to the same reference-date/Day-1 semantics `goal-farming-estimates` already specifies (an N-day estimate completes N-1 calendar days after the reference date); this requirement only changes how that already-correct date is displayed, not how it's computed.

#### Scenario: A goal 12 days from completion shows its date and day count

- **GIVEN** a goal's computed estimate is 12 days with a completion date of September 28
- **WHEN** the Done By cell renders on either the desktop table or the mobile card
- **THEN** it shows a calendar icon and "Sep 28" on the first line, and "in 12 days" on the second line

#### Scenario: A blocked goal is unaffected

- **GIVEN** a goal's estimate status is Blocked
- **WHEN** the Done By cell renders
- **THEN** it shows the existing blocked indicator and label, not a date or day count

#### Scenario: A goal with no estimate is unaffected

- **GIVEN** no estimate is available for a goal (for example no project is selected)
- **WHEN** the Done By cell renders
- **THEN** it shows the existing empty-estimate placeholder, not a date or day count
