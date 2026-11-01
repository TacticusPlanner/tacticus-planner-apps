## MODIFIED Requirements

### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu

Project actions SHALL NOT render as an always-visible inline icon cluster. Edit, Archive/Restore and Delete SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for the Default project, which is permanent (see "The Default project is permanent"), and Delete SHALL NOT be offered for it. Delete SHALL permanently remove a custom project, archived or not, only after an explicit confirmation that names the project and asks what happens to the goals that are in no other project: move them to the Default project (preselected) or delete them permanently. Goals that are also in another project SHALL always be kept there.

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit, Archive or Restore, and Delete actions appear with text labels

#### Scenario: Archiving a project

- **GIVEN** a custom (non-default) project
- **WHEN** the user activates Archive from its action menu
- **THEN** the project moves to the archived section and offers Restore

#### Scenario: Restoring an archived project

- **GIVEN** an archived project
- **WHEN** the user activates Restore from its action menu
- **THEN** the project returns to the available-project section

#### Scenario: Deleting a project

- **GIVEN** a custom project, archived or not
- **WHEN** the user activates Delete from its action menu and confirms with the preselected "move to the Default project" choice
- **THEN** the project is removed from every project list, and its goals remain, those in no other project now in the Default project

#### Scenario: Deleting a project with its goals

- **GIVEN** a custom project with one goal only in it and one goal also in another project
- **WHEN** the user activates Delete, chooses to delete the goals, and confirms
- **THEN** the project and the first goal are gone, and the second goal remains in its other project

#### Scenario: Cancelling a delete

- **WHEN** the user activates Delete and then cancels the confirmation
- **THEN** nothing is sent and the project is unchanged

### Requirement: The Projects row menu hosts every project-specific action

Each non-archived project row's overflow menu on `/plan/projects` SHALL offer, in order: **Create goal**, **Manage goals**, **Edit**, **Archive**, then **Delete** (the Default project offers neither Archive nor Delete; see "The Default project is permanent"). An archived project row's menu SHALL offer **Edit**, **Restore** and **Delete** only. Create goal SHALL open goal creation with that row's project preselected (see `goal-creation-entry-points`). Manage goals SHALL open the bulk membership surface for that row's project. Activating Create goal or Manage goals SHALL NOT navigate away from the Projects page.

#### Scenario: A live project's menu lists the four actions

- **WHEN** the user opens the overflow menu of a non-archived, non-Default project row
- **THEN** Create goal, Manage goals, Edit, and Archive appear, in that order, with text labels, followed by Delete

#### Scenario: Manage goals opens for that row's project

- **GIVEN** two projects A and B are listed
- **WHEN** the user chooses Manage goals on project B's row
- **THEN** the bulk membership surface opens for project B, the URL stays `/plan/projects`, and closing it returns to the unchanged list

#### Scenario: Create goal preselects that row's project

- **WHEN** the user chooses Create goal on a non-default project's row
- **THEN** the goal-creation sheet opens with that project preselected as the goal's membership, and the URL stays `/plan/projects`

#### Scenario: An archived project's menu is lifecycle-only

- **WHEN** the user opens the overflow menu of an archived project row
- **THEN** Edit, Restore and Delete appear, and neither Create goal nor Manage goals is offered
