# goal-detail-estimate-display Specification

## Purpose

Defines what the goal-detail sheet's Estimate section shows — the completion date and day count it shares with the Goals list, whether the figure was computed for this goal alone or as part of a project, and what it shows when no figure exists — so a reader can tell which model produced the number in front of them. Deliberately separate from `goal-list-estimate-display`, which scopes itself to the Goals list and explicitly disclaims this surface; neither capability changes how an estimate is calculated (see `goal-farming-estimates`).

## Requirements

### Requirement: The goal-detail estimate shows a completion date and day count

The goal-detail sheet's Estimate section SHALL, for a goal with a successfully
computed (non-blocked) estimate, show the same content the Goals list shows for
that goal: a calendar icon, the localized short completion date, and the day
count — not a day count alone. It SHALL use the Goals list's existing formatting
so that the same goal reads identically in both places, including the UTC-safe
parsing of the estimate's `YYYY-MM-DD` value (an estimate date SHALL NOT render
one day earlier for a viewer west of UTC).

A goal whose estimate is Blocked SHALL show its blocked reason and no date. A
goal with no computed estimate SHALL show the existing unavailable text and no
date. This content SHALL be identical on desktop and mobile — the detail sheet is
one component on both.

Assumptions this requirement depends on: the date's day-1-inclusive semantics are
`goal-farming-estimates`' ("Completion dates are inclusive of the first farming
day") and are unchanged by this requirement, which governs presentation only.

#### Scenario: An estimated goal shows its date

- **GIVEN** a goal whose computed estimate is 22 days completing on October 11
- **WHEN** its detail sheet's Estimate section renders
- **THEN** it shows a calendar icon, "Oct 11", and the 22-day count — the same
  content the goal's Goals list row shows

#### Scenario: A blocked goal shows no date

- **GIVEN** a goal whose estimate status is Blocked
- **WHEN** its detail sheet's Estimate section renders
- **THEN** it shows that blocked reason and no date or day count

#### Scenario: A goal with no estimate shows no date

- **GIVEN** a goal for which no estimate could be computed
- **WHEN** its detail sheet's Estimate section renders
- **THEN** it shows the existing unavailable text and no date or day count

### Requirement: The goal-detail estimate states which model produced it

The Estimate section SHALL distinguish an isolated estimate for this goal alone from a plan-aware estimate computed in the account-wide Active-goal schedule with one shared energy budget and globally higher-priority work. The label SHALL reflect the actual computation, not the goal's membership or launch route. An isolated figure SHALL show the "Isolated estimate" badge; a global plan-aware figure SHALL explain global priority contention. Exactly one SHALL appear when a date is shown, and neither for a blocked or unavailable estimate.

#### Scenario: An estimate computed within a project reads as plan-aware

- **GIVEN** a goal detail opened from project detail showing that goal's projection from the global plan
- **WHEN** its Estimate section renders a date
- **THEN** it shows a global plan-aware caption, not an isolated badge or claim of a project-only budget

#### Scenario: An estimate computed for one goal reads as isolated

- **GIVEN** a goal detail opened from a plan-of-one surface, even if it belongs to a project
- **WHEN** its Estimate section renders a date
- **THEN** it shows the Isolated estimate badge and not the plan-aware caption

#### Scenario: Neither framing appears without a date

- **WHEN** the goal's estimate is Blocked or unavailable
- **THEN** neither framing label is shown
