# goal-project-membership Specification

## Purpose

Defines how canonical Character/MoW goals participate in one or more projects, including searchable membership and project-scoped in-flight goal-type uniqueness.

## Requirements

### Requirement: A goal can belong to multiple projects

One canonical goal MAY belong to one or more projects. Edits to that goal SHALL appear everywhere it is a member; membership SHALL not duplicate it.

#### Scenario: Shared goal appears in two projects

- **WHEN** project B is added to a goal already in project A
- **THEN** the same goal identity appears in both projects

#### Scenario: Removing one membership does not delete the goal

- **GIVEN** a goal belongs to A and B
- **WHEN** A is removed
- **THEN** the goal remains in B

### Requirement: Selected memberships render as project chips

Creation and editing SHALL show selected memberships as removable chips containing project color/name and distinct Current plan, Default, and Archived markers where applicable.

#### Scenario: Memberships are visible without opening picker

- **GIVEN** several projects are selected
- **WHEN** the field renders
- **THEN** every selection is visible as a chip

### Requirement: Projects are added through a searchable picker

An Add to project picker SHALL search non-archived projects by name and exclude already-selected projects. Choosing a result SHALL not submit or close the surrounding goal form.

#### Scenario: Search narrows projects

- **WHEN** the user enters part of a project name
- **THEN** matching available projects are shown

#### Scenario: Archived project cannot be newly selected

- **WHEN** an unselected archived project is searched
- **THEN** it is not offered

### Requirement: Every goal retains at least one project membership

At least one project SHALL remain selected. The last chip cannot be removed and the field SHALL explain why. New goals without explicit context SHALL initially select Default project when it exists. If no project exists yet, creation SHALL omit explicit membership so the API creates the Default project on first use; the returned goal SHALL belong to that project.

#### Scenario: Last membership is protected

- **GIVEN** one project remains
- **WHEN** removal is attempted
- **THEN** it remains selected with an inline explanation

#### Scenario: First goal creates the Default project

- **GIVEN** the user has no projects
- **WHEN** a valid goal is created without explicit membership
- **THEN** the API creates the Default project and the goal belongs to it

### Requirement: Existing archived memberships remain understandable

An existing archived membership SHALL remain visible and marked Archived, but archived projects SHALL not be addable. It SHALL be removable only when another membership remains; last-membership protection takes precedence.

#### Scenario: Archived membership remains visible

- **WHEN** a goal's project is later archived
- **THEN** its marked membership chip remains visible during editing

#### Scenario: Final archived membership remains protected

- **GIVEN** an archived project is the goal's only membership
- **WHEN** its chip renders during editing
- **THEN** the chip remains selected, its remove action is disabled, and the existing last-membership explanation is shown

### Requirement: In-flight goal-type uniqueness is scoped to a project

Within one project, at most one Active/Paused goal SHALL exist for a given `(entityType, entityId, goalType)`. Completed/Archived goals SHALL not occupy the slot. Different projects MAY contain different Active/Paused instances for the same unit and type.

#### Scenario: Different projects have different targets

- **GIVEN** project A contains an Active Ragnar Rank goal
- **WHEN** a different Ragnar Rank goal is created only in project B
- **THEN** creation succeeds

#### Scenario: Same project rejects a second in-flight instance

- **GIVEN** project A contains an Active or Paused Ragnar Rank goal
- **WHEN** another Active/Paused Ragnar Rank goal is created in or added to A
- **THEN** the operation is rejected and identifies project A as conflicting

#### Scenario: Historical instance does not conflict

- **GIVEN** project A contains only a Completed or Archived Ragnar Rank goal
- **WHEN** a new Ragnar Rank goal is created in A
- **THEN** creation succeeds

#### Scenario: Shared canonical goal occupies every selected project

- **GIVEN** one Active Ragnar Rank goal belongs to A and B
- **WHEN** another Ragnar Rank goal is added to B
- **THEN** the operation is rejected for B

### Requirement: Project conflicts are resolved in the membership context

Goal creation/editing SHALL evaluate conflict state against selected projects rather than globally disabling a goal type for the unit. It SHALL identify each conflicting project and let the user remove that membership or use the existing goal.

#### Scenario: Only one selected project conflicts

- **GIVEN** Rank is occupied in A but available in B
- **WHEN** both projects are selected for a new Ragnar Rank goal
- **THEN** A is identified as conflicting while B is identified as available

### Requirement: Independent equipment goals are unsupported

Goal creation, filters, details, and client contract types SHALL support Character and MoW entities only. They SHALL not offer Item entities or the UpgradeItem goal type. Character/MoW Upgrade goals SHALL remain supported and their material targets SHALL use upgrade-material terminology.

#### Scenario: Goal type chooser omits equipment

- **WHEN** the user creates a goal
- **THEN** no independent equipment target or Upgrade Equipment goal type is offered

#### Scenario: Unit Upgrade remains available

- **WHEN** a valid Character or MoW is selected
- **THEN** its ordinary Upgrade goal type remains available

### Requirement: Membership editing adapts to desktop and mobile

At or above 768px, search SHALL use a compact anchored picker. Below 768px, it SHALL use a touch-friendly full-width popover or Sheet while selected chips remain visible.

#### Scenario: Mobile membership editing

- **WHEN** membership is edited below 768px
- **THEN** search and selection remain touch-friendly without obscuring selected chips
