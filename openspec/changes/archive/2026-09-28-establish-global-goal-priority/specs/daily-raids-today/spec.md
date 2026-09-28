## MODIFIED Requirements

### Requirement: Today's schedule scope

Today SHALL compute its schedule from all account goals whose status is `Active` (or, when a project is selected, that project's Active goals), each once in canonical global priority order. Paused, Completed, and Archived goals SHALL be excluded.

#### Scenario: Only Active goals contribute

- **GIVEN** Active goals in two projects and Paused/terminal goals alongside them
- **WHEN** Today loads
- **THEN** it schedules both Active goals in global order and excludes the others

#### Scenario: Paused goals do not contribute

- **GIVEN** a Paused goal with unmet farmable need
- **WHEN** Today loads
- **THEN** its need is absent from schedule, inventory allocation, and Bonus Raids

## REMOVED Requirements

### Requirement: Today has its own project selector

**Reason**: The selector no longer defaults to the Active/Default project; it defaults to all goals and only optionally narrows the run.

**Migration**: See "Today's project selector defaults to all goals" in this delta.

## ADDED Requirements

### Requirement: Today's project selector defaults to all goals

Today SHALL provide a project selector, shared with Raids Plan, that defaults to all goals. With no project selected Today SHALL use the account-wide Active-goal sequence and SHALL NOT derive its scope from Current plan or Default. Selecting a project SHALL narrow the run to that project's Active goals, still in canonical global priority order. A failed goal load SHALL show retry; a successful empty set SHALL show a no-active-goals state.

#### Scenario: Default selection is all goals

- **GIVEN** Active goals in several projects
- **WHEN** Today loads with no prior selection made this session
- **THEN** the selector shows all goals and Today shows the global schedule, including every project's Active goals

#### Scenario: Selecting a project narrows the schedule

- **WHEN** the user selects a project in Today's project selector
- **THEN** the schedule, Bonus Raids section and empty states are recomputed for that project's Active goals only, in global order

#### Scenario: Returning to all goals

- **GIVEN** a project is selected
- **WHEN** the user selects all goals
- **THEN** Today shows the account-wide schedule again

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails while global goals load successfully
- **WHEN** Today loads
- **THEN** Today renders the global schedule and does not misreport project-list failure as a schedule failure

#### Scenario: Project list loads without projects

- **GIVEN** no projects are available but global goals load successfully
- **WHEN** Today loads
- **THEN** Today derives its state from the global Active goals, not from project count
