## MODIFIED Requirements

### Requirement: Selected memberships render as project chips

Creation and editing SHALL show selected memberships as removable chips containing project color/name and distinct Default and Archived markers where applicable.

#### Scenario: Memberships are visible without opening picker

- **GIVEN** several projects are selected
- **WHEN** the field renders
- **THEN** every selection is visible as a chip

## REMOVED Requirements

### Requirement: Project membership does not change a goal's activation

**Reason**: Scenarios that mention making a project the Current plan no longer apply; the status-independence rule stays.

**Migration**: See the replacement requirement in this delta.

### Requirement: A newly created goal's status does not depend on which projects it is filed into

**Reason**: Scenarios that mention making a project the Current plan no longer apply; the status-independence rule stays.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: Project membership changes never alter a goal's status

A project organizes goals; it does not activate or deactivate them. Adding a goal to a project, removing it from one, and relocating it to the Default project SHALL all leave the goal's status unchanged. Pausing and resuming a goal SHALL remain available per goal and SHALL remain the only way a user changes whether a goal is active. No membership surface SHALL present membership as activating, deactivating, pausing, or resuming a goal.

#### Scenario: Editing membership leaves status alone

- **GIVEN** a Paused goal belonging to project A
- **WHEN** the user adds it to project B, or removes it from A, from any membership surface
- **THEN** the goal is still Paused afterwards

#### Scenario: Membership editing states what it does and does not do

- **WHEN** a goal's project memberships are shown for editing
- **THEN** visible copy states that membership changes only which projects contain the goal, and that pausing or resuming the goal is a separate per-goal action

#### Scenario: No membership control offers activation

- **WHEN** any surface that adds or removes project membership renders
- **THEN** it offers no control described as activating, deactivating, pausing, or resuming the goal as a consequence of membership

### Requirement: A goal's initial status is independent of its selected projects

Creating a goal SHALL produce a goal with the same status whichever projects are selected for it, including when the goal is filed into the Default project by default. The creation surface SHALL NOT state or imply that the chosen projects determine whether the new goal starts active.

#### Scenario: Creating into a non-default project

- **GIVEN** a Default project and a custom project B
- **WHEN** the user creates a goal whose only selected project is project B
- **THEN** the created goal has the same status it would have had if the Default project had been selected

#### Scenario: The membership field makes no promise about status

- **WHEN** the goal creation form renders its project membership field
- **THEN** its copy describes only which projects will contain the goal
