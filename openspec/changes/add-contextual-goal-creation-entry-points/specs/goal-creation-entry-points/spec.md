## Purpose

Defines the non-global places a user can start goal creation — the Goals
Overview toolbar and a project's own detail route — alongside the existing
global entry points, and how launching creation from a project context
preselects that project.

## ADDED Requirements

### Requirement: Goals Overview offers a contextual Create Goal entry point

Goals Overview SHALL render a Create Goal action within its own control row,
in addition to the app's existing global entry points (the desktop sidebar
button, the mobile bottom-nav button, and the keyboard shortcut). The action
SHALL be visible without hovering, focusing, or opening another control, at
both desktop and mobile breakpoints, and SHALL open the same creation sheet
the global entry points open, with no prefill.

#### Scenario: Desktop Overview shows the contextual entry point

- **WHEN** Overview is viewed at or above the 768px breakpoint
- **THEN** a labeled Create Goal action is visible in the control row
  alongside the other filter controls

#### Scenario: Mobile Overview shows the contextual entry point

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** a Create Goal action is visible in the control row, rendered
  icon-only like its sibling controls, with an accessible name identifying
  it

#### Scenario: Activating the contextual entry point opens creation

- **WHEN** the user activates Overview's Create Goal action
- **THEN** the goal-creation sheet opens with no entity, goal type, or
  project preselected

#### Scenario: Global entry points remain available

- **GIVEN** the contextual Create Goal action is present on Overview
- **WHEN** the user checks the app shell
- **THEN** the global entry points (sidebar button on desktop, bottom-nav
  button on mobile, and the keyboard shortcut) are still present and
  functional

### Requirement: Project Detail offers a Create Goal action distinct from Add Goals

A project's detail route SHALL render a Create Goal action, separate from
its existing Add Goals action. Add Goals SHALL keep its existing meaning —
assigning an existing, currently-unassigned goal to the viewed project.
Create Goal SHALL start a brand-new goal, scoped to the viewed project via
the "A project-scoped goal-creation launch preselects that project"
requirement below. Both actions SHALL be visible without hovering, focusing,
or opening another control, at both desktop and mobile breakpoints.

#### Scenario: Both actions are present and distinguishable

- **WHEN** a project's detail route renders its header
- **THEN** a labeled Add Goals action and a separately labeled Create Goal
  action are both visible

#### Scenario: Create Goal opens goal creation, not goal assignment

- **WHEN** the user activates the detail route's Create Goal action
- **THEN** the goal-creation sheet opens, not the existing-goal assembly
  surface that Add Goals opens

#### Scenario: Present on both breakpoints

- **WHEN** a project's detail route is viewed at or below the 768px
  breakpoint
- **THEN** the Create Goal action remains visible and labeled, consistent
  with the desktop presentation

### Requirement: A project-scoped goal-creation launch preselects that project

When goal creation is launched from a project context — currently, Project
Detail's Create Goal action — the creation sheet SHALL preselect that
project as the goal's membership before the user has chosen an entity or
goal type. The user MAY still change or clear that selection before saving,
the same as any other project selection in the creation sheet. Launching
creation with no project context (the global or Overview entry points)
SHALL be unaffected by this requirement and SHALL keep falling back to the
user's default project when no consecutive-creation context is remembered.
The separate `remember-consecutive-goal-context` change may offer remembered
membership on such a launch; an explicit project-scoped launch always wins.

#### Scenario: Creating from a non-default project preselects it

- **GIVEN** the user is viewing a project's detail route for a project that
  is not their default project
- **WHEN** they activate that route's Create Goal action
- **THEN** the creation sheet opens with that project preselected as the
  goal's membership, rather than the default project

#### Scenario: The preselected project can still be changed

- **GIVEN** a project-scoped creation launch has preselected a project
- **WHEN** the user changes the project selection in the creation sheet
  before saving
- **THEN** the created goal is assigned to the user's chosen selection, not
  the originally preselected project

#### Scenario: Launching with no project context and no remembered choice

- **WHEN** the user launches goal creation from a global or Overview entry
  point, with no project context or remembered membership
- **THEN** the creation sheet preselects the user's default project, the
  same as it does today
