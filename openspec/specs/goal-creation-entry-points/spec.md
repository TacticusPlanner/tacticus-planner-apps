# goal-creation-entry-points Specification

## Purpose

Defines the non-global places a user can start goal creation — the Goals
Overview toolbar and a project's detail header, menu, and Add Goals sheet —
alongside the existing global entry points, and how launching creation from
a project context preselects that project.

## Requirements

### Requirement: A project-scoped goal-creation launch preselects that project

When goal creation is launched from a project context — a Projects row's Create goal menu action, the Create new goal action inside that row's Manage goals sheet, Goals' contextual Create Goal action while a project scope is selected, or a global entry point (the sidebar button, bottom-nav button, or keyboard shortcut) used while the Goals page is scoped to a project (`/plan/goals?project={id}`) — the creation sheet SHALL preselect that project as the goal's membership before the user has chosen an entity or goal type. The user MAY still change or clear that selection before saving, the same as any other project selection in the creation sheet. Launching creation with no project context (Goals with "All goals" selected, the Projects page's New project flow, or a global entry point used anywhere else) SHALL be unaffected by this requirement and SHALL keep falling back to the user's Default project when no consecutive-creation context is remembered. The separate `remember-consecutive-goal-context` change may offer remembered membership on such a launch; an explicit project-scoped launch always wins.

#### Scenario: Creating from a non-default project preselects it

- **GIVEN** a project that is not the user's default project
- **WHEN** they choose Create goal from that project's row menu on the Projects page
- **THEN** the creation sheet opens with that project preselected as the goal's membership, rather than the default project

#### Scenario: Creating from scoped Goals preselects the scope

- **GIVEN** the user is on `/plan/goals?project={id}` for a non-default project
- **WHEN** they activate Goals' contextual Create Goal action
- **THEN** the creation sheet opens with that project preselected

#### Scenario: The preselected project can still be changed

- **GIVEN** a project-scoped creation launch has preselected a project
- **WHEN** the user changes the project selection in the creation sheet before saving
- **THEN** the created goal is assigned to the user's chosen selection, not the originally preselected project

#### Scenario: Global entry points preselect the viewed project

- **GIVEN** the user is on `/plan/goals?project={id}`
- **WHEN** they use a global entry point (sidebar button, bottom-nav button, or keyboard shortcut)
- **THEN** the creation sheet opens with that project preselected

#### Scenario: Launching with no project context and no remembered choice

- **WHEN** the user launches goal creation from Goals with "All goals" selected, or from a global entry point outside a scoped Goals page, with no remembered membership
- **THEN** the creation sheet preselects the user's default project, the same as it does today

### Requirement: Existing project controls can start a new goal

A Projects row's overflow menu and its Manage goals sheet SHALL each offer a
distinct Create goal / Create new goal action. Activating either SHALL launch the
normal goal-creation sheet with that row's project preselected. Manage goals
SHALL remain an existing-goal assignment flow; choosing Create new goal SHALL not
submit pending existing-goal selections or silently discard them.

#### Scenario: Create from project menu

- **WHEN** the user chooses Create goal from a project row's overflow menu
- **THEN** goal creation opens with that project preselected

#### Scenario: Create from Add Goals with pending selections

- **GIVEN** the user has selected existing goals in Manage goals
- **WHEN** they choose Create new goal
- **THEN** goal creation opens with that project preselected and no
  pending existing-goal assignment is submitted
- **AND** reopening Manage goals on that project restores the pending selections
  and search after either cancelling or completing goal creation

#### Scenario: No existing goal matches the Add Goals search

- **WHEN** the Manage goals search has no matches
- **THEN** its Create new goal action is still visible and usable

### Requirement: Goals offers a contextual Create Goal entry point

The Goals page (`/plan/goals`) SHALL render a Create Goal action within its own control row, in addition to the app's existing global entry points (the desktop sidebar button, the mobile bottom-nav button, and the keyboard shortcut). The action SHALL be visible without hovering, focusing, or opening another control, at both desktop and mobile breakpoints, and SHALL open the same creation sheet the global entry points open — with no prefill while "All goals" is selected, and with the scoped project preselected while a project scope is selected.

#### Scenario: Desktop Goals shows the contextual entry point

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** a labeled Create Goal action is visible in the control row alongside the other filter controls

#### Scenario: Mobile Goals shows the contextual entry point

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** a Create Goal action is visible in the control row, rendered icon-only like its sibling controls, with an accessible name identifying it

#### Scenario: Activating the contextual entry point opens creation

- **GIVEN** "All goals" is selected
- **WHEN** the user activates Goals' Create Goal action
- **THEN** the goal-creation sheet opens with no entity or goal type preselected and no explicit project prefill

#### Scenario: Global entry points remain available

- **GIVEN** the contextual Create Goal action is present on Goals
- **WHEN** the user checks the app shell
- **THEN** the global entry points (sidebar button on desktop, bottom-nav button on mobile, and the keyboard shortcut) are still present and functional
