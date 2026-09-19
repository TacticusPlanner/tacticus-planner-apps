## ADDED Requirements

### Requirement: The detail route assembles membership in bulk

The detail route SHALL provide an action that adds existing goals to the viewed project without visiting each goal individually. The surface it opens SHALL list the profile's goals, SHALL let the user search them, SHALL show for every listed goal whether it already belongs to the viewed project, and SHALL apply every selection in a single save. Goals already belonging to the project SHALL remain members when the selection is saved.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user is on a project's detail route
- **WHEN** they open the add-goals surface, select three goals, and save
- **THEN** all three belong to the project and no other membership of that project is lost

#### Scenario: Existing membership is visible while assembling

- **GIVEN** the project already contains some of the listed goals
- **WHEN** the add-goals surface renders
- **THEN** each listed goal shows whether it is already a member of the viewed project

#### Scenario: Search narrows the assembly list

- **WHEN** the user enters text in the add-goals surface
- **THEN** the listed goals narrow to those matching it

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** the project's membership changed elsewhere after the surface was opened
- **WHEN** the user saves a selection
- **THEN** the goals added elsewhere remain members of the project

#### Scenario: Assembly does not remove members

- **WHEN** the user saves a selection from the add-goals surface
- **THEN** no goal is removed from the project as a result of that save

#### Scenario: Added goals do not reorder existing units

- **GIVEN** a project whose units are in an established priority order
- **WHEN** goals for a new unit are added and saved
- **THEN** the existing units keep their relative order and the added unit is placed last

### Requirement: Assembly blocks a selection whose goal-type slot is occupied

A project holds at most one Active/Paused goal per `(entityType, entityId, goalType)`, and a save that would place two such goals in one project is rejected in full rather than in part. The assembly surface SHALL therefore identify a listed goal whose slot is already held by an Active/Paused member of the viewed project, SHALL prevent it from being selected, and SHALL state the reason. A save SHALL NOT be submitted in a state that would be rejected for this reason.

#### Scenario: Conflicting goal cannot be selected

- **GIVEN** the viewed project contains an Active goal for a unit and goal type
- **WHEN** the add-goals surface lists another Active goal for the same unit and goal type
- **THEN** that goal cannot be selected and the reason is stated

#### Scenario: A conflict arising after the check rejects the whole save

- **GIVEN** the user has selected several goals and one of them becomes conflicting after the surface checked it
- **WHEN** they save
- **THEN** nothing is added, the conflict is explained, and the selection remains available to correct rather than being discarded

#### Scenario: Historical goal in the project does not block selection

- **GIVEN** the viewed project contains only a Completed or Archived goal for that unit and goal type
- **WHEN** the add-goals surface lists another goal for the same unit and goal type
- **THEN** it can be selected and saved

### Requirement: Project goal rows offer removal alongside deletion

On the detail route, each goal row's action menu SHALL offer removing that goal from the viewed project in addition to deleting it. Removal SHALL take effect on the viewed project only. After a removal the row SHALL leave the viewed list, and the outcome SHALL be reported naming the goal and, when the goal was relocated, its destination project.

#### Scenario: A goal row offers both actions

- **WHEN** a goal row's action menu is opened on a project's detail route
- **THEN** both a project-removal action and an account-wide delete action are offered

#### Scenario: Removed goal leaves the viewed list

- **GIVEN** a goal is listed on project A's detail route
- **WHEN** it is removed from project A
- **THEN** it no longer appears in project A's list and the outcome is reported

#### Scenario: Relocation destination is reported

- **GIVEN** the removed goal's only membership was project A
- **WHEN** the removal completes
- **THEN** the reported outcome names the project the goal was relocated to
