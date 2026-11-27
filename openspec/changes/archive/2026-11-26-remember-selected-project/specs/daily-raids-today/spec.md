## MODIFIED Requirements

### Requirement: Today's project selector defaults to all goals

Today SHALL provide a project selector that defaults to all goals, using the shared, remembered selection (see `goals-navigation`). With no project selected Today SHALL NOT derive its scope from Default; the scope with and without a selection is defined by "Today's schedule scope". A failed goal load SHALL show retry; a successful empty set SHALL show a no-active-goals state.

#### Scenario: Default selection is all goals

- **GIVEN** Active goals in several projects
- **WHEN** Today loads with no project chosen before
- **THEN** the selector shows all goals and Today shows the global schedule, including every project's Active goals

#### Scenario: Selecting a project narrows the schedule

- **WHEN** the user selects a project in Today's project selector
- **THEN** the schedule, Bonus Raids section and empty states are recomputed for that project's Active goals only, in global order

#### Scenario: The selection is remembered

- **GIVEN** the user selected project B on Today
- **WHEN** they reload the page, or open Insights or Schedule
- **THEN** project B is selected there

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
