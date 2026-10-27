## MODIFIED Requirements

### Requirement: The Default project is permanent

Every account SHALL have exactly one Default project. It SHALL be renamable and editable like any project, SHALL NOT be archived or deleted (no control offers either), and SHALL be the relocation destination defined by `goal-project-membership` ("Every goal retains at least one project membership"). It SHALL be listed first wherever projects are listed and SHALL carry a Default marker. No other project SHALL carry a special status: there is no Active or Current plan project.

#### Scenario: Default project cannot be archived

- **WHEN** the Default project's action menu renders
- **THEN** Archive is unavailable with explanatory text and no delete action exists

#### Scenario: Default project can be renamed

- **WHEN** the user edits the Default project's name
- **THEN** the new name is saved and it remains the Default project, listed first

#### Scenario: No project is special beyond Default

- **WHEN** any project surface renders
- **THEN** it shows no Active, Current plan, or Make current label or control for any project

### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu

Project actions SHALL NOT render as an always-visible inline icon cluster. Edit and Archive/Restore SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for the Default project, which is permanent (see "The Default project is permanent").

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit and Archive or Restore actions appear with text labels

#### Scenario: Archiving a project

- **GIVEN** a custom (non-default) project
- **WHEN** the user activates Archive from its action menu
- **THEN** the project moves to the archived section and offers Restore

#### Scenario: Restoring an archived project

- **GIVEN** an archived project
- **WHEN** the user activates Restore from its action menu
- **THEN** the project returns to the available-project section

### Requirement: The Projects row menu hosts every project-specific action

Each non-archived project row's overflow menu on `/plan/projects` SHALL offer, in order: **Create goal**, **Manage goals**, **Edit**, then **Archive** (the Default project offers no Archive; see "The Default project is permanent"). An archived project row's menu SHALL offer **Edit** and **Restore** only. Create goal SHALL open goal creation with that row's project preselected (see `goal-creation-entry-points`). Manage goals SHALL open the bulk membership surface for that row's project. Activating Create goal or Manage goals SHALL NOT navigate away from the Projects page.

#### Scenario: A live project's menu lists the four actions

- **WHEN** the user opens the overflow menu of a non-archived, non-Default project row
- **THEN** Create goal, Manage goals, Edit, and Archive appear, in that order, with text labels

#### Scenario: Manage goals opens for that row's project

- **GIVEN** two projects A and B are listed
- **WHEN** the user chooses Manage goals on project B's row
- **THEN** the bulk membership surface opens for project B, the URL stays `/plan/projects`, and closing it returns to the unchanged list

#### Scenario: Create goal preselects that row's project

- **WHEN** the user chooses Create goal on a non-default project's row
- **THEN** the goal-creation sheet opens with that project preselected as the goal's membership, and the URL stays `/plan/projects`

#### Scenario: An archived project's menu is lifecycle-only

- **WHEN** the user opens the overflow menu of an archived project row
- **THEN** Edit and Restore appear, and neither Create goal nor Manage goals is offered

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and a goal/unit summary derived from the project's `goalIds` joined with the loaded goals list — no per-project read. Where summary data is available, the Default project card only SHALL also show reached, blocked, and estimate/progress information (completion date and unestimated goals), computed from the one global run; other project cards show the goal/unit summary only. Identity and actions SHALL remain usable while the goals list or a summary calculation loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and the goals list or the summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** the goals list read fails
- **THEN** every card shows its identity with an unavailable/retry summary state, and one retry re-reads the goals list

## REMOVED Requirements

### Requirement: Project goal rows offer removal alongside deletion

**Reason**: D47 — restates `goal-project-membership` row removal; its scenarios match that spec's one-to-one.

**Migration**: `goal-project-membership` "Membership is removable from the project context" and "The scoped Goals page's row menu hosts project removal".

### Requirement: Goal order drives priority-sensitive calculations

**Reason**: D54 — strict subset of `global-goal-priority` "One global active sequence drives all execution surfaces"; its scenario equals that requirement's "Mixed Character and Machine-of-War demand".

**Migration**: `global-goal-priority` "One global active sequence drives all execution surfaces".
