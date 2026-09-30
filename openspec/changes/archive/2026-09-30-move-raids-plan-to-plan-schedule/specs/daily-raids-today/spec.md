## MODIFIED Requirements

### Requirement: Today's project selector defaults to all goals

Today SHALL provide its own project selector that defaults to all goals; it is not shared with Schedule (see `daily-raids-plan` "Schedule owns its project selection"). With no project selected Today SHALL use the account-wide Active-goal sequence and SHALL NOT derive its scope from Current plan or Default. Selecting a project SHALL narrow the run to that project's Active goals, still in canonical global priority order. The selection SHALL NOT be persisted across a full page reload. A failed goal load SHALL show retry; a successful empty set SHALL show a no-active-goals state.

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

#### Scenario: Schedule's selection does not leak into Today

- **GIVEN** the user selected project B on Plan > Schedule this session
- **WHEN** they open Dailies > Raids
- **THEN** Today's selector shows all goals unless a project was chosen on Today itself

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails while global goals load successfully
- **WHEN** Today loads
- **THEN** Today renders the global schedule and does not misreport project-list failure as a schedule failure

#### Scenario: Project list loads without projects

- **GIVEN** no projects are available but global goals load successfully
- **WHEN** Today loads
- **THEN** Today derives its state from the global Active goals, not from project count
