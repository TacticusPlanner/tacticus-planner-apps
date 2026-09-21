## Purpose

How a user changes a goal's lifecycle status from the goals list: the primary pause/resume action available on every goal row, when Archive becomes available, the prerequisite cascade pause/resume triggers, and the project-scoped bulk pause/resume action. This is the same behavior on desktop and mobile — both render the same row-actions control (`GoalRowActions`), not platform-specific variants.

## ADDED Requirements

### Requirement: Pause and resume are primary row actions

Every goal row SHALL show a pause/resume control directly in its Actions area, visible without opening the "⋯" menu: an Active goal SHALL show a control that pauses it, and a Paused goal SHALL show a control that resumes it. A Completed or Archived goal SHALL show neither, since neither status accepts a pause/resume transition.

#### Scenario: An Active goal shows a pause control

- **GIVEN** a goal has status `Active`
- **WHEN** its row renders
- **THEN** the Actions area shows a visible pause control, reachable without opening the "⋯" menu

#### Scenario: A Paused goal shows a resume control

- **GIVEN** a goal has status `Paused`
- **WHEN** its row renders
- **THEN** the Actions area shows a visible resume control, reachable without opening the "⋯" menu

#### Scenario: A Completed or Archived goal shows neither control

- **GIVEN** a goal has status `Completed` or `Archived`
- **WHEN** its row renders
- **THEN** the Actions area shows no pause or resume control

### Requirement: Archive is available only once a goal has reached its target

The "⋯" menu's Archive item SHALL be offered only for a goal whose computed attainment is Reached (the same Reached signal the status filter's Reached count uses). A goal that has not reached its target SHALL NOT offer Archive as an option, so the choice between Pause and Archive is never ambiguous: Pause is for a goal not being worked on yet, Archive is for a goal whose target is already met. An already-archived goal SHALL always offer Unarchive, regardless of its current reached state, since restoring an archived goal to tracking is not gated the same way entering Archive is.

#### Scenario: An unreached goal offers no Archive option

- **GIVEN** a goal's target has not been reached
- **WHEN** its "⋯" menu opens
- **THEN** no Archive item is offered

#### Scenario: A reached goal offers Archive

- **GIVEN** a goal's target has been reached
- **WHEN** its "⋯" menu opens
- **THEN** an Archive item is offered

#### Scenario: An archived goal always offers Unarchive

- **GIVEN** a goal has status `Archived`
- **WHEN** its "⋯" menu opens
- **THEN** an Unarchive item is offered, whether or not the goal's target is currently reached

### Requirement: Pausing or resuming a goal cascades to its prerequisites

Using a goal's primary pause control SHALL also pause every goal listed in its `dependsOn` set, except a prerequisite that appears in another goal's `dependsOn` set as well — a prerequisite shared by more than one dependent SHALL be left at its current status, since pausing it could stall a sibling goal that is still active. Using a goal's primary resume control SHALL resume every goal listed in its `dependsOn` set unconditionally, with no shared-prerequisite exception, since resuming a prerequisite never stalls another dependent. In both directions, a prerequisite whose own status is `Completed` or `Archived` SHALL be excluded from the cascade entirely — the cascade SHALL NOT transition a finished prerequisite back to `Active` or `Paused`, since a goal the player has already completed or archived is done, regardless of what a dependent's own pause/resume does. The cascade applies only to the primary pause/resume row action; it SHALL NOT apply to the project-scoped bulk pause/resume action, whose own scope (every applicable goal in the project) already includes any in-project prerequisite.

#### Scenario: Pausing a goal pauses its sole prerequisite

- **GIVEN** goal B lists goal A in its `dependsOn`, and no other goal lists goal A
- **WHEN** the user pauses goal B via its primary pause control
- **THEN** goal A is also paused

#### Scenario: Pausing a goal does not pause a prerequisite shared by another active goal

- **GIVEN** goals B and C both list goal A in their `dependsOn`, and goal C is `Active`
- **WHEN** the user pauses goal B via its primary pause control
- **THEN** goal A's status is unchanged, since goal C still depends on it

#### Scenario: Resuming a goal resumes a shared prerequisite

- **GIVEN** goals B and C both list goal A in their `dependsOn`, goal A is `Paused`, and goal B is `Paused`
- **WHEN** the user resumes goal B via its primary resume control
- **THEN** goal A is also resumed, regardless of goal C also depending on it

#### Scenario: A completed prerequisite is never reopened by a cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, and goal A has status `Completed`
- **WHEN** the user pauses or resumes goal B via its primary control
- **THEN** goal A's status is unchanged — the cascade does not transition it to `Paused` or `Active`

#### Scenario: An archived prerequisite is never reopened by a cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, and goal A has status `Archived`
- **WHEN** the user pauses or resumes goal B via its primary control
- **THEN** goal A's status is unchanged — the cascade does not transition it to `Paused` or `Active`

### Requirement: Bulk pause and resume for a project

A project's detail route SHALL offer a "pause all goals" action and a "resume all goals" action, each transitioning every applicable goal in that project to the requested status in one request (`POST me/projects/{projectId}/goals/status` — already built, already excludes `Completed` and `Archived` goals from the bulk set). This is project-scoped: Goals Overview, which spans every project, SHALL NOT offer a bulk pause/resume action.

#### Scenario: Pausing all goals in a project

- **GIVEN** a project has a mix of `Active` and `Paused` goals
- **WHEN** the user selects "pause all goals" on that project's detail route
- **THEN** every `Active` goal in the project becomes `Paused`; already-`Paused` goals are unaffected

#### Scenario: Bulk pause leaves Completed and Archived goals untouched

- **GIVEN** a project has an `Active` goal, a `Completed` goal, and an `Archived` goal
- **WHEN** the user selects "pause all goals" on that project's detail route
- **THEN** the `Active` goal becomes `Paused`; the `Completed` and `Archived` goals keep their status, since the bulk action never revives a finished goal

#### Scenario: Bulk pause/resume is not offered on Goals Overview

- **WHEN** Goals Overview renders
- **THEN** no bulk pause/resume action is offered, since it has no single project to scope the action to
