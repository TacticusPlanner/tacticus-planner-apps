## MODIFIED Requirements

### Requirement: Goals shows each in-flight goal once in priority order

The Goals page (`/plan/goals`) SHALL list goals in canonical account-wide priority order, with Active and Paused goals leading in that order, including Character and Machine-of-War goals from every project, and SHALL offer no other sort order. A goal in multiple projects SHALL appear once. Paused goals SHALL remain visible with their state but SHALL not enter execution calculations. The view SHALL keep per-goal pause/resume and the Edit action (which opens the Edit goal dialog, where priority is also editable by position select; see `goal-edit-dialog`) available.

#### Scenario: Shared membership and mixed units

- **GIVEN** a Character goal in two projects and a Machine-of-War goal in one project
- **WHEN** Goals loads
- **THEN** each goal appears once in its stored order, with no unit grouping forced by the scheduler

#### Scenario: Paused goal

- **WHEN** a goal is Paused
- **THEN** it retains its visible order position but does not consume planning resources
