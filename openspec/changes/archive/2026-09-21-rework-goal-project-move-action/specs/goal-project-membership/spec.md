## ADDED Requirements

### Requirement: The goal row's project-removal action offers a chosen destination when relocation is needed

When a goal's viewed project is its only membership, the row's project-removal action ("Move to project") SHALL let the user choose the destination rather than relocating automatically: it SHALL list the account's other existing projects, and SHALL offer creating a new project as an additional option. Selecting an existing project SHALL move the goal there, subject to the occupied-slot conflict check described in "Relocation reports an occupied destination slot before removing". Choosing to create a new project SHALL open project creation; once the new project is saved, the goal SHALL move into it.

When the goal's viewed project is not its only membership, the row's project-removal action SHALL remain a plain removal with no destination to choose, leaving the goal a member of its other project(s) — unchanged from today's behavior.

This requirement governs the goal row's own project-removal action specifically. The goal's membership editor (its edit form's project chips) is a separate surface and keeps its own last-membership behavior — see "Every goal retains at least one project membership".

#### Scenario: Removal without a destination when other memberships exist

- **GIVEN** a goal belongs to projects A and B
- **WHEN** it is removed from A via its row action
- **THEN** it remains a member of B, and no destination picker is shown

#### Scenario: Moving to an existing project

- **GIVEN** a goal's only membership is project A, and the account also has project B
- **WHEN** the user opens the row's "Move to project" action and selects project B
- **THEN** the goal belongs to project B and no longer belongs to A

#### Scenario: Moving to a newly created project

- **GIVEN** a goal's only membership is project A
- **WHEN** the user opens "Move to project", chooses to create a new project, and saves it
- **THEN** the goal belongs to the newly created project and no longer belongs to A

### Requirement: Move to project has a single action when there is nowhere existing to move to

When a goal's viewed project is its only membership and the account has no other existing project, the row's "Move to project" action SHALL go directly to project creation rather than opening a picker with nothing in it, or presenting a disabled control with explanatory text about having nowhere to go.

#### Scenario: Only one project exists in the account

- **GIVEN** the account's only project is the goal's only membership
- **WHEN** the user activates "Move to project" on that row
- **THEN** project creation opens directly, with no picker step, no disabled control, and no explanatory tooltip

## MODIFIED Requirements

### Requirement: Every goal retains at least one project membership

At least one project SHALL remain selected. In the goal's membership editor (the chip-based project picker on the goal's edit form), removing a goal's last remaining membership SHALL relocate the goal to the Default project rather than being refused, and the editor SHALL name the Default project as the destination by its current name. When the Default project is itself the goal's only membership, removal in the membership editor has no destination: the membership SHALL remain selected and the editor SHALL explain why. New goals without explicit context SHALL initially select Default project when it exists. If no project exists yet, creation SHALL omit explicit membership so the API creates the Default project on first use; the returned goal SHALL belong to that project.

The goal row's own project-removal action, offered from within a specific project's context, is a separate surface with different destination-selection behavior — see "The goal row's project-removal action offers a chosen destination when relocation is needed" and "Move to project has a single action when there is nowhere existing to move to".

#### Scenario: Last membership relocates to the Default project

- **GIVEN** a goal whose only membership is a project other than Default
- **WHEN** that membership is removed in the membership editor
- **THEN** the goal belongs to the Default project and the destination is named by its current name

#### Scenario: Last membership is protected

- **GIVEN** a goal whose only membership is the Default project
- **WHEN** removal is attempted in the membership editor
- **THEN** it remains selected with an inline explanation

#### Scenario: Renamed Default project is named as the destination

- **GIVEN** the Default project has been renamed
- **WHEN** a goal's last non-Default membership is removed in the membership editor
- **THEN** the destination is identified by the project's current name rather than a fixed label

#### Scenario: First goal creates the Default project

- **GIVEN** the user has no projects
- **WHEN** a valid goal is created without explicit membership
- **THEN** the API creates the Default project and the goal belongs to it

### Requirement: Archived memberships remain visible and relocatable

An existing archived membership SHALL remain visible and marked Archived, but archived projects SHALL not be addable. Removing an archived membership in the membership editor SHALL follow the same last-membership behavior as any other membership there: when it is the goal's only membership, the goal SHALL relocate to the Default project, which can never itself be archived. Removing an archived membership via the goal row's own project-removal action instead follows that action's chosen-destination behavior.

#### Scenario: Archived membership remains visible

- **WHEN** a goal's project is later archived
- **THEN** its marked membership chip remains visible during editing

#### Scenario: Archived project cannot be newly added

- **WHEN** an unselected archived project is searched in the add picker
- **THEN** it is not offered

#### Scenario: Final archived membership relocates to Default

- **GIVEN** an archived project is the goal's only membership
- **WHEN** that membership is removed in the membership editor
- **THEN** the goal belongs to the Default project and is no longer reachable only through an archived project

### Requirement: Relocation reports an occupied destination slot before removing

Because a project holds at most one Active/Paused goal per `(entityType, entityId, goalType)`, relocating an Active or Paused goal to its destination project can conflict with a goal already there. The system SHALL detect that conflict and explain it, identifying the destination project and the conflicting goal type, rather than reporting a generic failure. The goal's memberships SHALL remain unchanged when relocation is refused. The destination is the Default project in the membership editor, or the user's chosen project (existing or newly created) for the goal row's project-removal action.

#### Scenario: Occupied destination slot is explained

- **GIVEN** a goal's only membership is project A, and its destination already contains an Active goal for the same unit and goal type
- **WHEN** moving it from A to that destination is attempted
- **THEN** the conflict is explained, naming the destination project and the goal type, and the goal remains a member of A

#### Scenario: Historical goal in the destination does not conflict

- **GIVEN** the destination project contains only a Completed or Archived goal for the same unit and goal type
- **WHEN** a goal's last membership is removed to that destination
- **THEN** relocation succeeds

#### Scenario: Conflict arising after the check is still reported

- **GIVEN** the destination slot becomes occupied between the check and the removal
- **WHEN** the removal is submitted
- **THEN** the same conflict explanation is shown and the goal's memberships remain unchanged

#### Scenario: A goal that occupies no slot relocates regardless of the destination

- **GIVEN** a Completed or Archived goal whose only membership is project A, and its destination holds an Active goal for the same unit and goal type
- **WHEN** removal from A is attempted
- **THEN** relocation succeeds, because a goal in that status occupies no goal-type slot

### Requirement: Removal is unavailable while the destination cannot be determined

Relocation depends on knowing the relevant destination information — the Default project for the membership editor, or the account's other existing projects for the goal row's "Move to project" picker. While that information is unknown — the project list is loading, failed to load, or the user is unauthenticated — the corresponding removal or move action SHALL be unavailable rather than submitted, and SHALL NOT submit an incomplete membership list.

#### Scenario: Removal waits for the project list

- **GIVEN** the project list has not loaded
- **WHEN** a goal's action menu is opened in a project context
- **THEN** the removal or move action is not actionable and no request is sent
