## REMOVED Requirements

### Requirement: Pause and resume are primary row actions

**Reason**: Row actions are consolidated into one "⋯" menu (Azure-style row menu in the name column) so the desktop table has no Actions column; a one-click pause icon no longer exists on either platform. Bulk Pause/Resume over a selection (`goal-bulk-actions`) covers the "act on several goals quickly" need that the primary icon served.
**Migration**: Pause/Resume are items of the row's "⋯" menu (see "Pause and resume live in the row menu"). Tests targeting the inline pause/resume icon buttons target the menu items instead.

## ADDED Requirements

### Requirement: Pause and resume live in the row menu

Every goal row that has not reached its target SHALL offer a pause or resume item in its "⋯" row-actions menu, on desktop and mobile alike: an Active goal's menu SHALL offer Pause, and a Paused goal's menu SHALL offer Resume. A Completed or Archived goal's menu SHALL offer neither, since neither status accepts a pause/resume transition. A goal whose computed attainment is Reached SHALL offer neither, whatever its stored status; its stored status is not changed by being Reached. The item SHALL be disabled while a request for that goal is in flight.

#### Scenario: An Active goal's menu offers Pause

- **GIVEN** a goal has status `Active` and has not reached its target
- **WHEN** its row menu is opened
- **THEN** it lists Pause and not Resume

#### Scenario: A Paused goal's menu offers Resume

- **GIVEN** a goal has status `Paused` and has not reached its target
- **WHEN** its row menu is opened
- **THEN** it lists Resume and not Pause

#### Scenario: A Reached goal's menu offers neither

- **GIVEN** a goal has status `Active` or `Paused` and its computed attainment is Reached
- **WHEN** its row menu is opened on desktop or mobile
- **THEN** it lists neither Pause nor Resume, and the goal's stored status is unchanged

## MODIFIED Requirements

### Requirement: Pausing or resuming a goal cascades to its prerequisites

Using a goal's row-menu Pause SHALL also pause every goal listed in its `dependsOn` set, except a prerequisite that appears in another goal's `dependsOn` set as well — a prerequisite shared by more than one dependent SHALL be left at its current status, since pausing it could stall a sibling goal that is still active. Using a goal's row-menu Resume SHALL resume every goal listed in its `dependsOn` set unconditionally, with no shared-prerequisite exception, since resuming a prerequisite never stalls another dependent. In both directions, a prerequisite whose own status is `Completed` or `Archived` SHALL be excluded from the cascade entirely — the cascade SHALL NOT transition a finished prerequisite back to `Active` or `Paused`, since a goal the player has already completed or archived is done, regardless of what a dependent's own pause/resume does. The cascade applies only to the single-goal row-menu action; it SHALL NOT apply to the selection-based bulk Pause/Resume of `goal-bulk-actions`, which acts on exactly the selected goals.

#### Scenario: Pausing a goal pauses its sole prerequisite

- **GIVEN** goal B lists goal A in its `dependsOn`, and no other goal lists goal A
- **WHEN** the user pauses goal B via its row menu
- **THEN** goal A is also paused

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

#### Scenario: Bulk pause does not cascade

- **GIVEN** goal B lists goal A in its `dependsOn`, both are Active, and only B is selected
- **WHEN** the user runs the bulk Pause action
- **THEN** B is paused and A remains Active
