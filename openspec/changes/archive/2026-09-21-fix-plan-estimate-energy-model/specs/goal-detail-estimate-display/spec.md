## ADDED Requirements

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

The Estimate section SHALL make clear which model produced the figure it shows:
an **isolated** estimate (computed for this goal alone, ignoring competing
goals) or a **plan-aware** estimate (computed as part of a project, sharing that
project's daily energy budget in priority order — see `goal-farming-estimates`).

This is a property of how the displayed estimate was computed, not of whether
the goal belongs to a project. The same goal MAY read as isolated when its sheet
is opened from a surface that estimates goals one at a time, and as plan-aware
when opened from a surface that estimates a whole project — those are two
genuinely different numbers and SHALL be labeled as such rather than reconciled.

An isolated estimate SHALL carry the existing "Isolated estimate" badge. A
plan-aware estimate SHALL instead carry a caption naming that the date accounts
for the goals prioritized above it in its project. Exactly one of the two SHALL
be present whenever a date is shown, and **neither** SHALL be shown for a
blocked or unavailable estimate — a framing label without a figure to frame
SHALL NOT render.

#### Scenario: An estimate computed within a project reads as plan-aware

- **GIVEN** a goal whose detail sheet is opened from a surface that estimates
  the whole project together
- **WHEN** its Estimate section renders a date
- **THEN** it shows the plan-aware caption and not the isolated badge

#### Scenario: An estimate computed for one goal reads as isolated

- **GIVEN** a goal whose detail sheet is opened from a surface that estimates
  that goal on its own — including a goal that does belong to a project
- **WHEN** its Estimate section renders a date
- **THEN** it shows the "Isolated estimate" badge and not the plan-aware caption

#### Scenario: Neither framing appears without a date

- **GIVEN** a goal whose estimate is Blocked or unavailable
- **WHEN** its detail sheet's Estimate section renders
- **THEN** neither the isolated badge nor the plan-aware caption is shown,
  whichever surface the sheet was opened from
