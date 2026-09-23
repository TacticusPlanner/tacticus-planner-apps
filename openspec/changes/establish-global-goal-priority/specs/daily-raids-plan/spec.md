## MODIFIED Requirements

### Requirement: Raids Plan shares Today's selected project

Raids Plan and Today SHALL share one global Active-goal execution scope and the same underlying schedule, with no project selector on either tab. Switching tabs SHALL retain only view-local presentation settings, not choose another plan.

#### Scenario: Selecting a project on Today updates Raids Plan too

- **WHEN** the user changes a project-browsing preference elsewhere and switches between Today and Raids Plan
- **THEN** both tabs still show the same account-wide plan and no project selector

#### Scenario: Raids Plan mirrors Today's project-list failure state

- **GIVEN** project-list loading fails but global goals load
- **WHEN** Raids Plan loads
- **THEN** it renders the global schedule and does not show a project-list error

#### Scenario: Raids Plan mirrors Today's empty-project state

- **GIVEN** no projects are available but global goals load
- **WHEN** Raids Plan loads
- **THEN** it derives its empty or populated state from Active goals, not project count

### Requirement: Raids Plan includes Today

Raids Plan SHALL compute its schedule from the same account-wide Active goals in canonical global priority order and the same engine run as Today. It SHALL render the complete sequence beginning with Day 1 labeled "Today", followed by Day 2 onward.

#### Scenario: Day columns start with Today

- **GIVEN** an account-wide in-scope farmable schedule
- **WHEN** Raids Plan loads
- **THEN** its first day is Today and matches the Today tab's schedule

#### Scenario: Everything resolves within Day 1

- **GIVEN** all in-scope farmable need resolves within Day 1
- **WHEN** Raids Plan loads
- **THEN** it still renders Today as the complete one-day plan
