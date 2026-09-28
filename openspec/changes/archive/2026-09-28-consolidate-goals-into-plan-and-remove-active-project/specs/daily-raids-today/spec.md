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
