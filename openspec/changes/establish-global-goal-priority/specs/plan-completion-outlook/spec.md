## MODIFIED Requirements

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
