# goal-edit-dialog Specification

## Purpose

Defines the minimal Edit goal dialog that replaces the read-only goal detail: one focused form to change a goal's target, priority, notes, projects, and farming preferences, opened from an Edit action on each goal in the list.

## Requirements

### Requirement: Each goal offers an Edit action that opens the Edit goal dialog

Wherever the Goals list renders (desktop table and mobile cards, on Overview and on a project's detail route), each goal SHALL offer an Edit action that opens the Edit goal dialog for that goal. Activating the goal's name, its row, or its card SHALL NOT open any panel. The read-only goal detail (history, dependencies, blockers, estimate, farming guidance, progress, and its view/edit mode switch) SHALL NOT exist.

#### Scenario: Edit from the desktop table

- **GIVEN** the Goals list renders at or above 768px
- **WHEN** the user activates a row's Edit action
- **THEN** the Edit goal dialog opens for that goal

#### Scenario: Edit from a mobile card

- **GIVEN** the Goals list renders below 768px
- **WHEN** the user activates a card's Edit action
- **THEN** the Edit goal form opens for that goal in the bottom-anchored presentation

#### Scenario: Name or row does nothing

- **WHEN** the user activates a goal's name or clicks its row outside the row's controls
- **THEN** no dialog or panel opens

#### Scenario: Same action on Overview and Project Detail

- **WHEN** the user opens a project's detail route
- **THEN** its goals offer the same Edit action and dialog as Overview

### Requirement: The Edit goal dialog contains only editable fields

The Edit goal dialog SHALL show the goal's unit and kind as read-only text (the goal type SHALL NOT be changeable), followed by only these editable fields: the goal target (for kinds that have one, per `goal-target-editing`), the goal's priority, notes, project memberships, and the farming preferences that apply to the goal's kind (rank farming strategy; Unlock/Ascension acquisition sources per `goal-acquisition-source-picker`; farming locations for the remaining kinds). It SHALL NOT show history, dependencies or prerequisites, blockers, an estimate, progress, remaining resources, or farming guidance. An Unlock goal, which has no editable target, SHALL show no target section.

#### Scenario: Rank goal

- **WHEN** the dialog opens for an Active Rank goal
- **THEN** it shows the unit and "Rank" read-only, then the target, priority, notes, projects, and farming strategy, and no history, dependencies, blockers, estimate, progress, or guidance

#### Scenario: Goal type is fixed

- **WHEN** the dialog is open
- **THEN** no control changes the goal's kind

#### Scenario: Unlock goal

- **WHEN** the dialog opens for an Unlock goal
- **THEN** it shows no target section and shows priority, notes, projects, and acquisition sources

### Requirement: Priority is chosen with a position select

For an Active or Paused goal the dialog SHALL show a Priority select whose options are the positions 1 to N, where N is the number of Active and Paused goals in the account-wide order (`global-goal-priority`), preselected to the goal's current position. Saving a different position SHALL move the goal to that position with every goal between shifting one place toward the vacated position, exactly as a drag reorder of the same goal to that position would. A goal that holds no global position (any other status) SHALL show no Priority select. A Reached goal keeps its stored status and its position, and so shows the select.

#### Scenario: Move up

- **GIVEN** five in-flight goals A, B, C, D, E in that order
- **WHEN** the user opens E's dialog, selects position 3, and saves
- **THEN** the order becomes A, B, E, C, D

#### Scenario: Move down

- **GIVEN** the same five goals
- **WHEN** the user opens C's dialog, selects position 5, and saves
- **THEN** the order becomes A, B, D, E, C

#### Scenario: Unchanged position

- **WHEN** the user saves without changing the Priority select
- **THEN** no reorder is submitted

#### Scenario: Order changed elsewhere

- **WHEN** the account's goal order changed since the dialog opened and the save's reorder is rejected as stale
- **THEN** the dialog stays open with the draft, states the order changed, and offers a way to reload the current order before retrying

### Requirement: One Save submits every change

The dialog SHALL have one Save button and a Cancel. Save SHALL be enabled only when at least one field differs from the loaded goal and all validation passes (a valid target per `goal-target-editing`, at least one project without a membership conflict, and valid location/source choices). Save SHALL submit every changed section (target, goal fields, project memberships, priority) in one atomic request, so either all changes are saved or none are. When it succeeds the dialog SHALL close and the list SHALL reflect the changes without a full reload. If the request fails, the dialog SHALL stay open, keep the whole draft, and name what failed; nothing SHALL be shown as saved.

#### Scenario: Several fields at once

- **WHEN** the user changes the target, notes, and priority and saves
- **THEN** the target, notes, and position are all saved by that one action and the dialog closes

#### Scenario: Nothing changed

- **WHEN** the dialog opens and no field changes
- **THEN** Save is disabled

#### Scenario: Untouched target does not block Save

- **WHEN** the owner edits only notes, priority or projects of a goal whose stored target would not pass target validation (for example an untargeted Machine-of-War Ability track stored below its start)
- **THEN** no target error is shown, Save is enabled, and the request carries no target section

#### Scenario: Untargeted Ability track

- **WHEN** the owner changes only one Ability track's target
- **THEN** the other track's select shows its start level and the request sends it at its start, as creation does

#### Scenario: One section fails, nothing is saved

- **GIVEN** the user changed the target and the projects
- **WHEN** the request is rejected because the projects conflict with another goal
- **THEN** the dialog stays open with the whole draft and the conflict message, and neither the target nor the projects were saved

#### Scenario: Stale target revision

- **WHEN** the goal changed elsewhere and the request is rejected as stale
- **THEN** the dialog keeps the draft, saves nothing, and offers refresh-and-retry per `goal-target-editing`

### Requirement: Closing with unsaved changes asks for confirmation

Closing the dialog by Cancel, the close control, or Escape while any field differs from the loaded goal SHALL first ask for confirmation to discard the changes; with no changes it SHALL close immediately. Clicking outside the dialog SHALL NOT close it.

#### Scenario: Discard prompt

- **WHEN** the user edits notes and presses Escape
- **THEN** a discard confirmation appears and the dialog stays open until confirmed

#### Scenario: Outside click

- **WHEN** the user clicks the overlay outside the dialog
- **THEN** the dialog stays open

### Requirement: The dialog loads and fails visibly

While the goal loads the dialog SHALL show a skeleton rather than empty fields. If the goal fails to load or no longer exists, it SHALL show an error with a way to close, and SHALL NOT offer Save.

#### Scenario: Loading

- **WHEN** the dialog opens before the goal has loaded
- **THEN** a skeleton renders and Save is not offered

#### Scenario: Load failure

- **WHEN** the goal cannot be loaded
- **THEN** an error message and a close control render, with no Save

### Requirement: Edit and create goal dialogs use the available space on desktop

On desktop (at or above 768px) the Edit goal dialog and the Create goal dialog SHALL be centered dialogs sized to the viewport (wide, up to a maximum width, with a maximum height that scrolls the body, never the header or the footer), laying their fields out in two columns at widths where two columns fit and one column otherwise. They SHALL be compact: dense label/field spacing and tight gaps and paddings, so that the Create form for a Rank or Ability character goal fits without scrolling at 1440x900 (ideally 1280x720) and the Edit form for a Rank goal fits at 1440x900. In the Create dialog the "Current status" section and the "Goal type" selector SHALL sit side by side in two columns (one column below the container breakpoint and on mobile). Neither dialog SHALL show explanatory helper paragraphs; supplementary hints SHALL be an accessible tooltip (`title` plus an accessible name) and validation and error messages SHALL stay visible. The header (title) and the footer SHALL stay visible while the body scrolls, and the footer SHALL end with the dismiss button (Close/Cancel, outline) followed by the primary button (Create goal/Save) as its rightmost button. Below 768px the presentation SHALL remain the existing bottom-anchored sheet with a single column.

#### Scenario: Wide desktop

- **GIVEN** a viewport of 1440x900
- **WHEN** either dialog opens for a goal kind with several fields
- **THEN** it renders centered with fields in two columns and needs no scrolling for a Rank goal's fields

#### Scenario: Short desktop viewport

- **GIVEN** a viewport of 1280x600
- **WHEN** a dialog's content is taller than the viewport
- **THEN** its body scrolls while its title and Save/Cancel remain visible

#### Scenario: Narrow desktop

- **GIVEN** a viewport just above 768px in which two columns do not fit
- **WHEN** either dialog opens
- **THEN** its fields render in a single column

#### Scenario: Mobile

- **GIVEN** a viewport below 768px
- **WHEN** either dialog opens
- **THEN** it is the bottom-anchored sheet with one column, as before this change

#### Scenario: Compact Edit dialog

- **GIVEN** a viewport of 1440x900
- **WHEN** the Edit dialog opens for a Rank goal
- **THEN** target, priority, notes, projects and farming strategy fit without scrolling and no helper paragraph (projects description, activation note, priority hint, reached-target note) is visible

#### Scenario: Footer order

- **WHEN** either dialog is open on desktop
- **THEN** the dismiss button (outline) precedes the primary button, which is the rightmost
