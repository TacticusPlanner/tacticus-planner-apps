## Purpose

Makes the Projects page the dedicated surface for creating, editing, activating, and archiving projects — inline, on the page itself — replacing the disconnected side-panel editor, and gives it the same goal-filtering controls as Overview.

## ADDED Requirements

### Requirement: Projects lists all projects inline

The Projects page SHALL render every non-deleted project (active and archived) as its own row directly on the page, showing that project's color indicator, name, and status marker (default/active/archived), without requiring the user to open a separate panel to see the list.

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the Projects page
- **THEN** every project the user owns is listed as a row on the page itself

### Requirement: Inline project editing

Each project row SHALL provide an "Edit" action that expands an inline form (name, description, color) directly under that row. Submitting the form SHALL save the change without navigating away from the Projects page or opening an overlay panel.

#### Scenario: Editing a project expands inline

- **WHEN** the user activates "Edit" on a project row
- **THEN** an inline form with that project's current name, description, and color appears under the row, and the rest of the page remains visible

#### Scenario: Saving an inline edit updates the row

- **GIVEN** the user has changed a project's name in its inline edit form
- **WHEN** the user submits the form
- **THEN** the project row reflects the new name and the inline form closes

### Requirement: Inline project creation

The Projects page SHALL provide a "New project" affordance at the end of the project list that expands the same inline form used for editing, with empty fields. Submitting it SHALL add the new project to the list.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name, and submits
- **THEN** the new project appears as a row in the list and its inline form closes

### Requirement: Inline project lifecycle actions

Each project row SHALL provide, inline, the actions applicable to its current state: "Set active" when the project is not the active plan, "Archive" when the project is not archived (disabled for the default project or the current active plan), and "Restore" when the project is archived. No project lifecycle action SHALL require leaving the Projects page.

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

### Requirement: No bulk pause/resume on Projects

The Projects page SHALL NOT provide a control that pauses or resumes every goal in a project at once. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens the Projects page
- **THEN** no "Pause all" or "Resume all" control is rendered anywhere on the page

### Requirement: Selecting a project row scopes the goal list

Clicking a project row (outside its inline actions) SHALL select that project as the one whose goals are shown in the goal list below. The Projects page SHALL NOT additionally render a separate project-picker select for this purpose.

#### Scenario: Selecting a project row updates the goal list

- **GIVEN** the Projects page is showing project A's goals
- **WHEN** the user clicks project B's row
- **THEN** the goal list below updates to show project B's goals, and project B's row is shown as selected

### Requirement: Projects shares Overview's goal filters

The goal list on the Projects page SHALL offer the same Type, Sort, and Group filters as Overview, applied to the selected project's goals, in addition to the shared status filter.

#### Scenario: Type filter narrows the selected project's goals

- **GIVEN** a project with goals of multiple types
- **WHEN** the user selects a specific type from the Type filter
- **THEN** only that project's goals of the selected type are shown

#### Scenario: Group by unit groups the selected project's goals

- **WHEN** the user selects "Group by unit" on the Projects page
- **THEN** the selected project's goals are grouped by unit, the same way Overview groups goals

### Requirement: No project exists yet

When the user has no projects at all, the Projects page SHALL show the inline "New project" affordance prominently and SHALL NOT render a goal list or its filters below it.

#### Scenario: Empty project list prompts creation

- **GIVEN** the user has never created a project
- **WHEN** the user opens the Projects page
- **THEN** the project list area shows only the "New project" affordance, and no goal list or goal filters are rendered
