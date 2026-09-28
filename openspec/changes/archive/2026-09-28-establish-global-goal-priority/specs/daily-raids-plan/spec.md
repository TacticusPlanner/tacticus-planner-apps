## MODIFIED Requirements

### Requirement: Raids Plan shares Today's selected project

Raids Plan SHALL use the same project selection as Today (one selection shared across both Raids sub-tabs, defaulting to all goals) rather than maintaining an independent selector. Switching the project on either sub-tab SHALL recompute both; with no project selected both show the account-wide plan.

#### Scenario: Selecting a project on Today updates Raids Plan too

- **GIVEN** the user is on Today with all goals selected
- **WHEN** the user selects project B and switches to Raids Plan
- **THEN** Raids Plan shows project B's Active goals in global order without a separate selection

#### Scenario: Default is all goals

- **WHEN** Raids Plan loads with no prior selection this session
- **THEN** it shows the account-wide plan and the selector reads all goals

#### Scenario: Raids Plan mirrors Today's project-list failure state

- **GIVEN** project-list loading fails but global goals load
- **WHEN** Raids Plan loads
- **THEN** it renders the global schedule and does not show a project-list error

#### Scenario: Raids Plan mirrors Today's empty-project state

- **GIVEN** no projects are available but global goals load
- **WHEN** Raids Plan loads
- **THEN** it derives its empty or populated state from Active goals, not project count

### Requirement: Raids Plan includes Today

Raids Plan SHALL compute its schedule from the same Active goals (account-wide, or the selected project's) in canonical global priority order and the same engine run as Today. It SHALL render the complete sequence beginning with Day 1 labeled "Today", followed by Day 2 onward.

#### Scenario: Day columns start with Today

- **GIVEN** an account-wide in-scope farmable schedule
- **WHEN** Raids Plan loads
- **THEN** its first day is Today and matches the Today tab's schedule

#### Scenario: Everything resolves within Day 1

- **GIVEN** all in-scope farmable need resolves within Day 1
- **WHEN** Raids Plan loads
- **THEN** it still renders Today as the complete one-day plan
