## Purpose

Makes Projects a list/detail pair of routes: `/goals/projects` for browsing, creating, and managing projects, and `/goals/projects/{id}` for one project's own row plus its goal table — separating "manage a project" from "choose which project's goals to view" into two distinct routes instead of two controls competing for the same page.

## ADDED Requirements

### Requirement: Projects has a list route and a single-project detail route

The system SHALL present project management at `/goals/projects` (the list) and a specific project's own view at `/goals/projects/{id}` (the detail route), both addressable by URL.

#### Scenario: The list route shows every project

- **WHEN** the user navigates to `/goals/projects`
- **THEN** the project list renders, with no single project's goal table shown

#### Scenario: The detail route shows one project

- **WHEN** the user navigates to `/goals/projects/{id}` for a project they own
- **THEN** that project's own row renders at the top, followed by that project's goal table

### Requirement: The list route shows every project without its goal table

The list route SHALL render every non-deleted project (active and archived) as its own row — color indicator, name, and status marker (default/active/archived) — and SHALL NOT render a goal table, a project selector, or goal filters; those belong to the detail route only.

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the list route
- **THEN** every project the user owns is listed as a row, including archived ones, and no goal table is rendered

### Requirement: A project row navigates to its detail route

On the list route, activating a project row anywhere other than one of its inline action icons SHALL navigate to that project's detail route (`/goals/projects/{id}`). Activating an action icon SHALL NOT trigger that navigation.

#### Scenario: Clicking a row opens its detail route

- **WHEN** the user clicks a project row outside its action icons
- **THEN** the app navigates to that project's `/goals/projects/{id}` route

#### Scenario: Clicking an action icon does not navigate

- **WHEN** the user clicks one of a row's inline action icons (Edit, Set active, Archive, or Restore)
- **THEN** that action runs and the app does not navigate away from the list route

### Requirement: Creating and editing a project uses a form Sheet

The list route SHALL provide a "New project" affordance and, on each project row (list or detail), an "Edit" action. Both SHALL open the same form (name, description, color) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the current route.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

### Requirement: Project lifecycle actions render as inline icons on each row

Each project row — on the list route, and on the detail route's single current-project row — SHALL provide its applicable lifecycle actions as inline icon buttons directly on the row, not behind an overflow/"⋯" menu: "Set active" when the project is not the active plan, "Archive" when the project is not archived (disabled while a request is pending, or when the project is the default project or the current active plan), and "Restore" when the project is archived. Each icon SHALL have an accessible name. No lifecycle action SHALL require leaving the current route.

#### Scenario: Setting a project active

- **GIVEN** a non-active project's row
- **WHEN** the user activates its inline "Set active" icon
- **THEN** that project becomes the active plan and its row's status marker updates accordingly

#### Scenario: Archiving a project

- **GIVEN** a project row that is neither the default project nor the current active plan
- **WHEN** the user activates its inline "Archive" icon
- **THEN** the project's status updates to archived and its row shows a "Restore" icon instead

#### Scenario: Restoring an archived project

- **GIVEN** an archived project's row
- **WHEN** the user activates its inline "Restore" icon
- **THEN** the project's status returns to active and its row shows the standard lifecycle icons again

#### Scenario: Archive is unavailable for the default or active project

- **GIVEN** a project row that is the default project or the current active plan
- **WHEN** the row renders
- **THEN** its "Archive" icon is disabled

### Requirement: The detail route's current-project row matches the list route's row

The detail route SHALL render the current project's row using the same presentation and the same inline action icons as its equivalent row on the list route, so an action taken there behaves identically to taking it from the list.

#### Scenario: Archiving from the detail route behaves like archiving from the list

- **GIVEN** the user is on a project's detail route
- **WHEN** the user activates that row's inline "Archive" icon
- **THEN** the project's status updates to archived, the same as activating "Archive" from its list-route row would

### Requirement: No bulk pause/resume on Projects

Neither route SHALL provide a control that pauses or resumes every goal in a project at once. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens either the list or detail route
- **THEN** no "Pause all" or "Resume all" control is rendered

### Requirement: The detail route's project selector switches which project's detail route is shown

The detail route SHALL render a project selector after the current project's row, and changing it SHALL navigate to the newly-selected project's own detail route (`/goals/projects/{newId}`) rather than changing the goal list in place.

#### Scenario: Changing the selector navigates to a different project's detail route

- **GIVEN** the user is on project A's detail route
- **WHEN** the user changes the project selector to project B
- **THEN** the app navigates to project B's detail route, showing project B's own row and goal table

#### Scenario: Acting on a different project's row does not navigate

- **GIVEN** the user is on project A's detail route
- **WHEN** the user is shown project A's row only (the detail route renders no other project's row to act on)
- **THEN** there is no way to change another project's lifecycle status from this route without first navigating to it

### Requirement: The detail route shares Overview's goal filters

The detail route's goal table SHALL offer the same Type, Sort, and Group filters as Overview, applied to the current project's goals, alongside the shared status filter.

#### Scenario: Type filter narrows the current project's goals

- **GIVEN** a project with goals of multiple types, shown on its detail route
- **WHEN** the user selects a specific type from the Type filter
- **THEN** only that project's goals of the selected type are shown

#### Scenario: Group by unit groups the current project's goals

- **WHEN** the user selects "Group by unit" on a project's detail route
- **THEN** that project's goals are grouped by unit, the same way Overview groups goals

### Requirement: No project exists yet

When the user has no projects at all, the list route SHALL show the "New project" affordance prominently and SHALL NOT render a goal table.

#### Scenario: Empty project list prompts creation

- **GIVEN** the user has never created a project
- **WHEN** the user opens the list route
- **THEN** the page shows only the "New project" affordance, and no project rows or goal table are rendered

### Requirement: The list route has no redundant page heading

The list route SHALL NOT render its own "Projects" (or equivalent) page title — the shared section header already identifies the page.

#### Scenario: No duplicate title renders

- **WHEN** the user opens the list route
- **THEN** the page's own content contains no repeated "Projects" heading beyond the shared section header above it
