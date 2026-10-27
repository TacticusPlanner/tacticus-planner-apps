## MODIFIED Requirements

### Requirement: A project-scoped goal-creation launch preselects that project

When goal creation is launched from a project context — a Projects row's Create goal menu action, the Create new goal action inside that row's Manage goals sheet, Goals' contextual Create Goal action while a project scope is selected, or a global entry point (the sidebar button, bottom-nav button, or keyboard shortcut) used while the Goals page is scoped to a project (`/plan/goals?project={id}`) — the creation sheet SHALL preselect that project as the goal's membership before the user has chosen an entity or goal type. The user MAY still change or clear that selection before saving, the same as any other project selection in the creation sheet. Launching creation with no project context (Goals with "All goals" selected, the Projects page's New project flow, or a global entry point used anywhere else) SHALL be unaffected by this requirement and SHALL keep falling back to the user's Default project when no consecutive-creation context is remembered. Remembered membership and its precedence follow `goal-creation` ("Consecutive creation retains compatible context").

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
