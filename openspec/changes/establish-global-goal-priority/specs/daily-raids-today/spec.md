## MODIFIED Requirements

### Requirement: Today has its own project selector

Today SHALL not present a project selector or derive execution scope from Current plan or Default. It SHALL use the account-wide Active-goal sequence. Project browsing elsewhere SHALL not recompute Today's schedule. A failed global-goal load SHALL show retry; a successful empty global set SHALL show a no-active-goals state.

#### Scenario: Default selection is the Active project

- **GIVEN** a project is marked Current plan
- **WHEN** Today loads
- **THEN** it shows the global schedule, including Active goals outside that project, with no project selector

#### Scenario: Falls back to the Default project when there is no Active project

- **GIVEN** no Current plan exists but a Default project does
- **WHEN** Today loads
- **THEN** it still shows the account-wide schedule rather than a Default-only schedule

#### Scenario: Switching the selected project

- **WHEN** the user changes a project-browsing selection elsewhere
- **THEN** Today's schedule and Bonus Raids stay unchanged

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails while global goals load successfully
- **WHEN** Today loads
- **THEN** Today renders the global schedule and does not misreport project-list failure as a schedule failure

#### Scenario: Project list loads without projects

- **GIVEN** no projects are available but global goals load successfully
- **WHEN** Today loads
- **THEN** Today derives its state from the global Active goals, not from project count

### Requirement: Today's schedule scope

Today SHALL compute its schedule from all account goals whose status is `Active`, each once in canonical global priority order. Paused, Completed, and Archived goals SHALL be excluded, regardless of project membership or Current plan.

#### Scenario: Only Active goals contribute

- **GIVEN** Active goals in two projects and Paused/terminal goals alongside them
- **WHEN** Today loads
- **THEN** it schedules both Active goals in global order and excludes the others

#### Scenario: Paused goals do not contribute

- **GIVEN** a Paused goal with unmet farmable need
- **WHEN** Today loads
- **THEN** its need is absent from schedule, inventory allocation, and Bonus Raids
