## REMOVED Requirements

### Requirement: Goals Overview offers a contextual Create Goal entry point

**Reason**: The page is now called Goals (`/plan/goals`), and its scenarios name "Overview". The validator forbids dropping scenarios from a modified requirement, so the requirement is removed and re-added under the new name.

**Migration**: See "Goals offers a contextual Create Goal entry point" below; behaviour is unchanged.

## MODIFIED Requirements

### Requirement: A project-scoped goal-creation launch preselects that project

When goal creation is launched from a project context — Project Detail's header or three-dot menu, its Add Goals sheet, or a global entry point (the sidebar button, bottom-nav button, or keyboard shortcut) used while a project's detail route (`/plan/projects/:projectId`) is open — the creation sheet SHALL preselect that project as the goal's membership before the user has chosen an entity or goal type. The user MAY still change or clear that selection before saving, the same as any other project selection in the creation sheet. Launching creation with no project context (Goals, or a global entry point used outside a project's detail route) SHALL be unaffected by this requirement and SHALL keep falling back to the user's Default project when no consecutive-creation context is remembered. The separate `remember-consecutive-goal-context` change may offer remembered membership on such a launch; an explicit project-scoped launch always wins.

#### Scenario: Creating from a non-default project preselects it

- **GIVEN** the user is viewing a project's detail route for a project that is not their default project
- **WHEN** they activate that route's Create Goal action
- **THEN** the creation sheet opens with that project preselected as the goal's membership, rather than the default project

#### Scenario: The preselected project can still be changed

- **GIVEN** a project-scoped creation launch has preselected a project
- **WHEN** the user changes the project selection in the creation sheet before saving
- **THEN** the created goal is assigned to the user's chosen selection, not the originally preselected project

#### Scenario: Global entry points preselect the viewed project

- **GIVEN** the user is viewing a project's detail route
- **WHEN** they use a global entry point (sidebar button, bottom-nav button, or keyboard shortcut)
- **THEN** the creation sheet opens with that project preselected

#### Scenario: Launching with no project context and no remembered choice

- **WHEN** the user launches goal creation from Goals, or from a global entry point outside a project's detail route, with no remembered membership
- **THEN** the creation sheet preselects the user's default project, the same as it does today

## ADDED Requirements

### Requirement: Goals offers a contextual Create Goal entry point

The Goals page (`/plan/goals`) SHALL render a Create Goal action within its own control row, in addition to the app's existing global entry points (the desktop sidebar button, the mobile bottom-nav button, and the keyboard shortcut). The action SHALL be visible without hovering, focusing, or opening another control, at both desktop and mobile breakpoints, and SHALL open the same creation sheet the global entry points open, with no prefill.

#### Scenario: Desktop Goals shows the contextual entry point

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** a labeled Create Goal action is visible in the control row alongside the other filter controls

#### Scenario: Mobile Goals shows the contextual entry point

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** a Create Goal action is visible in the control row, rendered icon-only like its sibling controls, with an accessible name identifying it

#### Scenario: Activating the contextual entry point opens creation

- **WHEN** the user activates Goals' Create Goal action
- **THEN** the goal-creation sheet opens with no entity or goal type preselected and no explicit project prefill

#### Scenario: Global entry points remain available

- **GIVEN** the contextual Create Goal action is present on Goals
- **WHEN** the user checks the app shell
- **THEN** the global entry points (sidebar button on desktop, bottom-nav button on mobile, and the keyboard shortcut) are still present and functional
