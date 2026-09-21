## ADDED Requirements

### Requirement: A project reports a projected completion date over its estimable goals

For the project currently being estimated, the system SHALL report a projected
completion date derived from the latest completion date among the project's
goals that have a successfully computed (non-blocked) estimate. Goals that
cannot be estimated SHALL be excluded from that maximum rather than suppressing
it, and the system SHALL report how many of the project's goals were excluded.

The excluded count SHALL be taken against the project's member goals, not
against the subset the estimator was given — a goal dropped before estimation
(no remaining farmable demand and no farming stages, no resolved priority, or a
demand met entirely by uncosted resources) SHALL count as excluded, not as
absent. A project of such goals SHALL therefore be distinguishable from a
project with no goals at all.

The date SHALL be absent when no goal in the project could be estimated. A
project with no goals SHALL report no date and no exclusions.

Assumptions this requirement depends on:

- Per-goal completion dates come from the shared plan estimate and carry its
  priority-contention semantics (see `goal-farming-estimates`), so this date is
  "when the last estimable goal in the project's current priority order
  finishes" and changes when priorities change.
- A goal is excluded when its estimate status is Blocked, when no estimate was
  produced for it, or when it was filtered out before estimation.

#### Scenario: All goals estimable

- **GIVEN** a project whose three goals estimate to 3, 7, and 12 days
- **WHEN** the project's projected completion date is derived
- **THEN** it is the 12-day goal's completion date, with zero goals excluded

#### Scenario: One goal blocked

- **GIVEN** a project of three goals where two estimate to 3 and 7 days and the
  third is Blocked
- **WHEN** the project's projected completion date is derived
- **THEN** it is the 7-day goal's completion date, with one goal excluded — not
  an absent date

#### Scenario: Every goal blocked

- **GIVEN** a project whose every goal's estimate is Blocked
- **WHEN** the project's projected completion date is derived
- **THEN** no date is reported and every goal is counted as excluded

#### Scenario: Goals filtered out before estimation still count as excluded

- **GIVEN** a project whose only goals are dropped before estimation — for
  example an Ascension goal whose sole remaining demand is ascension orbs
- **WHEN** the project's projected completion date is derived
- **THEN** no date is reported and those goals are counted as excluded, so the
  result differs from an empty project's

#### Scenario: Empty project

- **GIVEN** a project with no goals
- **WHEN** the project's projected completion date is derived
- **THEN** no date is reported and no goals are counted as excluded

### Requirement: Onslaught token accumulation extends the projected date but never creates it

When the project's plan requires more Onslaught tokens than the account
currently holds, the projected completion date SHALL be extended to the day
those tokens accumulate at the current Onslaught cadence, if that day falls
later than the date derived from the project's estimable goals. The project date
MAY therefore fall later than every individual goal's own completion date.

This extension SHALL apply only to an existing date. When no goal in the project
could be estimated there is no date to extend, and the system SHALL report no
date rather than the token-accumulation day on its own — a completion date
anchored to no goal is not a projection of the plan.

Assumptions this requirement depends on: token demand is accumulated across the
project's goals as their needs are derived, before any goal is known to be
unestimable, so an excluded goal's token demand can still extend the date of a
project that has at least one estimable goal. That is a known limitation of this
requirement, not a guarantee of it.

#### Scenario: A shortfall extends a real date

- **GIVEN** a project whose latest estimable goal completes on October 11, and
  whose Ascension goals need more Onslaught tokens than the account holds,
  accumulating past that day
- **WHEN** the project's projected completion date is derived
- **THEN** it is the later token-accumulation date, not October 11

#### Scenario: A shortfall with nothing estimable produces no date

- **GIVEN** a project whose every goal's estimate is Blocked, and whose derived
  token demand exceeds the account's balance
- **WHEN** the project's projected completion date is derived
- **THEN** no date is reported — the token-accumulation day is not shown as the
  project's completion date

#### Scenario: No shortfall leaves the date alone

- **GIVEN** a project whose account already holds every token its plan needs
- **WHEN** the project's projected completion date is derived
- **THEN** it is the date derived from the estimable goals, unextended

### Requirement: The projected completion date is shown formatted, labeled, and with its exclusions

Every surface showing a project's projected completion date — the Insights
summary, the project detail header, and the projects list row — SHALL render it
with the same localized short-date formatting the Goals list uses for a goal's
Done By date, including that list's UTC-safe parsing, rather than the estimate's
raw `YYYY-MM-DD` value. That formatting SHALL be shared rather than
reimplemented per surface, and SHALL live where a feature-layer surface can
consume it without importing from a page.

When any of the project's goals are excluded from the date, the excluded count
SHALL be shown wherever the date would be shown, whether or not a date is
present; a date SHALL NOT appear on its own when the count is above zero.

When no date can be reported, the Insights summary SHALL show its existing
unknown placeholder alongside the exclusion information. The project detail
header and the projects list row SHALL omit the date entirely and show the
exclusion information alone — neither carries a placeholder today and neither
gains one, because a lone dash beside those surfaces' inline reached/blocked
counts reads as a broken value rather than an absent one.

The projects list SHALL show this date only for the project whose insights are
current; other project rows SHALL show no date and no placeholder implying one
is missing.

#### Scenario: Formatting matches the goal rows

- **GIVEN** a project whose latest estimable goal completes on October 11
- **WHEN** the Insights summary, project detail header, and projects list row
  render the projected completion date
- **THEN** each shows the same localized short date that goal's own row shows,
  not a raw `2026-10-11`

#### Scenario: Exclusions travel with the date

- **GIVEN** a project with one Blocked goal and a date derived from the rest
- **WHEN** any of the three surfaces renders that date
- **THEN** it also states that one goal is excluded from it

#### Scenario: Nothing estimable, on Insights

- **GIVEN** a project whose every goal is Blocked
- **WHEN** the Insights summary renders
- **THEN** it shows the unknown placeholder together with the exclusion
  information, and no date

#### Scenario: Nothing estimable, on the project surfaces

- **GIVEN** the same project
- **WHEN** the project detail header and the projects list row render
- **THEN** each shows the exclusion information with no date line and no
  placeholder in its place

#### Scenario: A non-current project row

- **GIVEN** the projects list, with one project's insights current
- **WHEN** the rows render
- **THEN** only the current project's row shows a projected completion date, and
  the others show neither a date nor a placeholder for one
