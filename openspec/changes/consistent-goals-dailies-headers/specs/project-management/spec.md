## Purpose

Makes the Projects page the dedicated surface for viewing, editing, activating, and archiving projects — an on-page list plus a focused create/edit form — replacing the old combined list-and-form side panel, and separates "manage a project" from "choose which project's goals to view" into two distinct controls.

## ADDED Requirements

### Requirement: Projects lists all projects inline

The Projects page SHALL render every non-deleted project (active and archived) as its own row directly on the page, showing that project's color indicator, name, and status marker (default/active/archived), without requiring the user to open a separate panel to see the list.

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the Projects page
- **THEN** every project the user owns is listed as a row on the page itself, including archived ones

### Requirement: Creating and editing a project uses a form Sheet

The Projects page SHALL provide a "New project" affordance and, on each project row, an "Edit" action. Both SHALL open the same form (name, description, color) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the Projects page.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

### Requirement: Project lifecycle actions are available directly on each row

Each project row SHALL provide, without opening the Sheet, the actions applicable to its current state: "Set active" when the project is not the active plan, "Archive" when the project is not archived (disabled while a request is pending, or when the project is the default project or the current active plan), and "Restore" when the project is archived. No lifecycle action SHALL require leaving the Projects page.

#### Scenario: Setting a project active

- **GIVEN** a non-active project's row
- **WHEN** the user activates "Set active" on that row
- **THEN** that project becomes the active plan and its row's status marker updates accordingly

#### Scenario: Archiving a project

- **GIVEN** a project row that is neither the default project nor the current active plan
- **WHEN** the user activates "Archive" on that row
- **THEN** the project's status updates to archived and its row shows a "Restore" action instead

#### Scenario: Restoring an archived project

- **GIVEN** an archived project's row
- **WHEN** the user activates "Restore" on that row
- **THEN** the project's status returns to active and its row shows the standard lifecycle actions again

#### Scenario: Archive is unavailable for the default or active project

- **GIVEN** a project row that is the default project or the current active plan
- **WHEN** the row renders
- **THEN** its "Archive" action is disabled

### Requirement: No bulk pause/resume on Projects

The Projects page SHALL NOT provide a control that pauses or resumes every goal in a project at once. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens the Projects page
- **THEN** no "Pause all" or "Resume all" control is rendered anywhere on the page

### Requirement: A dedicated project selector scopes the goal list

The Projects page SHALL render a project selector after the project list, separate from the list's rows, and the goal list below SHALL show only the goals of whichever project that selector currently has selected. Interacting with a project row (its lifecycle actions or Edit) SHALL NOT change which project the goal list shows.

#### Scenario: The project selector changes which project's goals are shown

- **GIVEN** the Projects page's selector is set to project A
- **WHEN** the user changes the selector to project B
- **THEN** the goal list below updates to show project B's goals

#### Scenario: Editing or acting on a project row leaves the goal list selection unchanged

- **GIVEN** the goal list is currently showing project A's goals
- **WHEN** the user archives, restores, sets active, or edits a different project, project B, from its row
- **THEN** the goal list continues showing project A's goals

### Requirement: No project exists yet

When the user has no projects at all, the Projects page SHALL show the "New project" affordance prominently and SHALL NOT render the project selector or a goal list.

#### Scenario: Empty project list prompts creation

- **GIVEN** the user has never created a project
- **WHEN** the user opens the Projects page
- **THEN** the project list area shows only the "New project" affordance, and no project selector or goal list is rendered
