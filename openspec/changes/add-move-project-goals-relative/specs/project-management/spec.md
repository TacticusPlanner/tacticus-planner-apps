# Spec Delta

## MODIFIED Requirements

### Requirement: The Projects row menu hosts every project-specific action

Each non-archived project row's overflow menu on `/plan/projects` SHALL offer, in order: **Create goal**, **Manage goals**, **Move goals…** (only when the project holds at least one in-flight goal; see `project-goal-moves`), **Edit**, **Archive**, then **Delete** (the Default project offers neither Archive nor Delete; see "The Default project is permanent"). An archived project row's menu SHALL offer **Edit**, **Restore** and **Delete** only. Create goal SHALL open goal creation with that row's project preselected (see `goal-creation-entry-points`). Manage goals SHALL open the bulk membership surface for that row's project. Activating Create goal, Manage goals or Move goals… SHALL NOT navigate away from the Projects page.

#### Scenario: A live project's menu lists the four actions

- **WHEN** the user opens the overflow menu of a non-archived, non-Default project row that holds in-flight goals
- **THEN** Create goal, Manage goals, Move goals…, Edit, and Archive appear, in that order, with text labels, followed by Delete

#### Scenario: Manage goals opens for that row's project

- **GIVEN** two projects A and B are listed
- **WHEN** the user chooses Manage goals on project B's row
- **THEN** the bulk membership surface opens for project B, the URL stays `/plan/projects`, and closing it returns to the unchanged list

#### Scenario: Create goal preselects that row's project

- **WHEN** the user chooses Create goal on a non-default project's row
- **THEN** the goal-creation sheet opens with that project preselected as the goal's membership, and the URL stays `/plan/projects`

#### Scenario: An empty project has no Move goals

- **WHEN** the user opens the menu of a project with no in-flight goals
- **THEN** Move goals… is not offered

#### Scenario: An archived project's menu is lifecycle-only

- **WHEN** the user opens the overflow menu of an archived project row
- **THEN** Edit, Restore and Delete appear, and neither Create goal, Manage goals nor Move goals… is offered
