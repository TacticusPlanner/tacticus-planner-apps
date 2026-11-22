## REMOVED Requirements

### Requirement: Schedule owns its project selection

**Reason**: Superseded by "Schedule uses the shared project selection" below. Schedule now shares the remembered project selection with Dailies and Insights instead of keeping its own session-only one.

**Migration**: None.

## ADDED Requirements

### Requirement: Schedule uses the shared project selection

Schedule SHALL provide a project selector using the shared project-selector component, right-aligned in its own row with the Planning Settings trigger trailing after it. Its selection SHALL be the shared, remembered one (see `goals-navigation`), defaulting to "All goals" (the account-wide plan). A failed project-list load SHALL NOT be reported as a plan failure; with no projects the page SHALL derive its state from Active goals.

#### Scenario: Default is all goals

- **WHEN** Schedule loads with no project chosen before
- **THEN** the selector reads "All goals" and the account-wide plan renders

#### Scenario: Selecting a project narrows the plan

- **WHEN** the user selects project B on Schedule
- **THEN** the summary and day columns recompute for project B's Active goals in global order

#### Scenario: Today follows the selection

- **GIVEN** project B is selected on Schedule
- **WHEN** the user opens Dailies › Raids
- **THEN** Today shows project B selected

#### Scenario: Reload keeps the selection

- **GIVEN** project B is selected on Schedule
- **WHEN** the user reloads `/plan/schedule`
- **THEN** project B is still selected

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails but global goals load
- **WHEN** Schedule loads
- **THEN** it renders the account-wide plan and does not show a project-list error as a plan error

#### Scenario: No projects

- **GIVEN** no projects are available but global goals load
- **WHEN** Schedule loads
- **THEN** it derives its empty or populated state from Active goals, not project count
