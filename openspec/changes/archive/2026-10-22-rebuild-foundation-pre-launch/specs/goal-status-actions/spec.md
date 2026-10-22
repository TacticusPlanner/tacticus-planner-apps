# Spec Delta

## MODIFIED Requirements

### Requirement: Pausing or resuming a goal cascades to its prerequisites

Using a goal's row-menu Pause SHALL also pause every goal listed in its `dependsOn` set, except a prerequisite that appears in another goal's `dependsOn` set as well — a prerequisite shared by more than one dependent SHALL be left at its current status, since pausing it could stall a sibling goal that is still active. Using a goal's row-menu Resume SHALL resume every goal listed in its `dependsOn` set unconditionally, with no shared-prerequisite exception, since resuming a prerequisite never stalls another dependent. In both directions, a prerequisite whose own status is `Completed` or `Archived` SHALL be excluded from the cascade entirely — the cascade SHALL NOT transition a finished prerequisite back to `Active` or `Paused`, since a goal the player has already completed or archived is done, regardless of what a dependent's own pause/resume does. The acting goal and its cascade targets SHALL be sent in one status request, which is atomic: either every goal in it transitions or none does; a rejection SHALL revert every optimistically updated row and show one error naming the conflicting goal. The cascade applies only to the single-goal row-menu action; it SHALL NOT apply to the selection-based bulk Pause/Resume of `goal-bulk-actions`, which acts on exactly the selected goals.

#### Scenario: Pausing a goal pauses its sole prerequisite

- **GIVEN** goal B lists goal A in its `dependsOn`, and no other goal lists goal A
- **WHEN** the user pauses goal B via its row menu
- **THEN** goal A is also paused, and exactly one request carrying B and A is issued

#### Scenario: Pausing a goal does not pause a prerequisite shared by another active goal

- **GIVEN** goals B and C both list goal A in their `dependsOn`, and goal C is `Active`
- **WHEN** the user pauses goal B via its row menu
- **THEN** goal A's status is unchanged, since goal C still depends on it

#### Scenario: Resuming a goal resumes a shared prerequisite

- **GIVEN** goals B and C both list goal A in their `dependsOn`, goal A is `Paused`, and goal B is `Paused`
- **WHEN** the user resumes goal B via its row menu
- **THEN** goal A is also resumed, regardless of goal C also depending on it

#### Scenario: A completed prerequisite is never reopened by a cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, and goal A has status `Completed`
- **WHEN** the user pauses or resumes goal B via its row menu
- **THEN** goal A's status is unchanged — the cascade does not transition it to `Paused` or `Active`

#### Scenario: An archived prerequisite is never reopened by a cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, and goal A has status `Archived`
- **WHEN** the user pauses or resumes goal B via its row menu
- **THEN** goal A's status is unchanged — the cascade does not transition it to `Paused` or `Active`

#### Scenario: A rejected cascade changes nothing

- **GIVEN** goal B lists Paused goal A in its `dependsOn`, and another in-flight goal now holds A's slot
- **WHEN** the user resumes goal B via its row menu
- **THEN** neither B nor A is resumed, both rows show Paused, and one error names A and the goal holding its slot

#### Scenario: Bulk pause does not cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, both are Active, and only B is selected
- **WHEN** the user runs the bulk Pause action
- **THEN** B is paused and A remains Active
