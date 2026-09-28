# plan-completion-outlook Specification

## Purpose

Defines the project-level projected completion date — the single "when is this plan done" figure shown on Insights, the project detail header, and the projects list row. Covers what it aggregates (the latest date among the goals that could be estimated), how it degrades when some or all of a project's goals cannot be estimated, how Onslaught token accumulation may extend it, and how every surface must present it: formatted like the per-goal dates in `goal-list-estimate-display`, and never without the count of goals it leaves out. It does not change how any individual goal's estimate is calculated — see `goal-farming-estimates`.

## Requirements

### Requirement: A project reports a projected completion date over its estimable goals

A project's projected completion date SHALL be the latest successfully computed, non-blocked completion date among its member goals, taken from the one account-wide global plan run. Filtering to a project SHALL not reallocate inventory or energy or change a member's date. Unestimable, blocked, or pre-estimation-dropped member goals SHALL be counted as excluded rather than suppressing the date; the count is against all project members. If none can be estimated, there SHALL be no date. An empty project SHALL have no date and no exclusions.

Assumptions:

- Per-goal dates include contention from all globally higher-priority Active goals, including those outside this project.
- A goal is excluded if Blocked, missing an estimate, or dropped before estimation; project filtering never removes it from the global run.

#### Scenario: All goals estimable

- **GIVEN** a project's three goals have global-run completion dates at 3, 7, and 12 days
- **WHEN** its outlook is derived
- **THEN** it uses the 12-day date with zero exclusions

#### Scenario: One goal blocked

- **GIVEN** two member goals have global-run dates at 3 and 7 days and a third is Blocked
- **WHEN** its outlook is derived
- **THEN** it uses the 7-day date with one exclusion

#### Scenario: Every goal blocked

- **WHEN** all project members are Blocked in the global run
- **THEN** no date is reported and all are counted as excluded

#### Scenario: Goals filtered out before estimation still count as excluded

- **GIVEN** only members dropped before estimation, such as an Ascension goal needing only orbs
- **WHEN** its outlook is derived
- **THEN** no date is reported and those goals are excluded, unlike an empty project

#### Scenario: Empty project

- **WHEN** a project has no goals
- **THEN** it has no date and no exclusions

### Requirement: Onslaught token accumulation extends the projected date but never creates it

The global plan SHALL allocate the account's Onslaught token balance and cadence across Active goals in global priority order. A project's outlook SHALL use the already-computed token-aware dates of its members; it SHALL not recalculate a project-only token budget. Token accumulation SHALL extend an existing member-derived date if later, but SHALL not create a date where no member can be estimated. Demand from an excluded goal can still extend a plan that has an estimable goal, preserving the known limitation.

#### Scenario: A shortfall extends a real date

- **GIVEN** a project's latest estimable goal has a global-run date of October 11 and global token allocation pushes its token-ready day later
- **WHEN** the project's outlook is derived
- **THEN** the later token-aware date is used

#### Scenario: A shortfall with nothing estimable produces no date

- **GIVEN** all project goals are Blocked but their token demand exceeds the account balance
- **WHEN** outlook is derived
- **THEN** no date is reported solely from token accumulation

#### Scenario: No shortfall leaves the date alone

- **GIVEN** the account already holds all tokens needed before the member goals finish
- **WHEN** outlook is derived
- **THEN** the latest member completion date is unextended

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
