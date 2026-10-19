# Spec Delta

## MODIFIED Requirements

### Requirement: Creating and editing a project uses a form Sheet

The list route SHALL provide a "New project" affordance and, on each project row, an "Edit" action. Both SHALL open the same form (name, description, color and, for a non-Default project, Related to — see `project-event-target`) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the current route. The Projects page SHALL be the only surface offering a New project action; the Legendary Event plan wizard MAY create a project with an event target as part of the plan it creates.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

#### Scenario: Goals offers no project creation

- **WHEN** the user opens the Goals page at either breakpoint
- **THEN** no New project or Create project action is rendered there
