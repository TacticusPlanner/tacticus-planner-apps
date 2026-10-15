## MODIFIED Requirements

### Requirement: Goals project scope is URL state

The Goals page's project filter ("project scope") SHALL be the `project` query parameter of `/plan/goals`: `/plan/goals?project={id}` shows only goals that are members of that project, and `/plan/goals` with no parameter shows all goals. Selecting a scope on the page SHALL update the parameter by replacing the current history entry, so Back leaves the Goals page rather than stepping through scopes. The scope SHALL survive a reload and be shareable as a link. When the parameter names a project that is unknown, archived, or not the user's, the page SHALL show all goals with the "All goals" chip selected and drop the parameter from the URL (replace). While the project list is loading, the parameter SHALL be preserved in the URL and the list SHALL show its loading state (see `goal-list-layout`: "The list stays in its loading state until row membership is known"); once the scope is valid, the list SHALL keep that loading state until the project's member list has loaded, and SHALL NOT show the "filters match nothing" line meanwhile. If the project list fails to load, the parameter SHALL be preserved in the URL and the list SHALL show all goals.

#### Scenario: Deep link opens scoped

- **WHEN** the user opens `/plan/goals?project={id}` for one of their non-archived projects
- **THEN** the goal list contains only that project's members and that project's chip is the selected one

#### Scenario: Selecting a chip updates the URL without a history entry

- **GIVEN** the user is on `/plan/goals` having arrived from `/home`
- **WHEN** they select project B's chip and then press Back
- **THEN** the URL was `/plan/goals?project={B}` while selected, and Back returns to `/home`, not to unscoped Goals

#### Scenario: Reload keeps the scope

- **GIVEN** the user is on `/plan/goals?project={id}`
- **WHEN** they reload the page
- **THEN** the same project remains selected and filtered

#### Scenario: Unknown or archived project falls back to all goals

- **WHEN** the user opens `/plan/goals?project={id}` where the id is archived or not one of their projects
- **THEN** all goals are listed, "All goals" is selected, and the URL is replaced with `/plan/goals`

#### Scenario: Project list failed to load

- **GIVEN** the project list fails to load
- **WHEN** the user opens `/plan/goals?project={id}`
- **THEN** all goals are listed, the URL keeps `?project={id}`, and no project-list error is shown by the chip row

#### Scenario: Deep link while projects load

- **GIVEN** the goal list has loaded but the project list has not
- **WHEN** the user opens `/plan/goals?project={id}`
- **THEN** the list shows its loading skeleton rather than all goals, and the URL keeps `?project={id}`

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the reorder-mode toggle (always present; disabled while goals load or when reordering is unavailable), the select-mode toggle (`goal-bulk-actions`; always present, disabled while goals load or when no row is visible), the order info affordance, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers in a third row, each retaining an accessible name for its full label. Because every control in this row is present from the first render, the row SHALL NOT shift when goals finish loading. The bulk actions themselves SHALL NOT render in this row; they live in the select-mode bottom bar. When the controls do not fit one line (for example at 360px, and with the density control from `add-goals-overview-density-option`), the row SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the scope chip row renders first, the status filter renders in its own row beneath it, and the Type/Group filters, reorder and select toggles, order info affordance, contextual Create Goal action, and Planning Settings control render in a row beneath that

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type/Group filters, the select-mode toggle, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

#### Scenario: The mobile reorder toggle is a control-row icon

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** an icon-only reorder-mode toggle with an accessible name appears enabled in the same control row, and it stays in place but disabled when reordering is unavailable

#### Scenario: The mobile control row does not shift while goals load

- **WHEN** Goals is viewed below the 768px breakpoint and the goal list is still loading
- **THEN** the reorder-mode and select-mode toggles render disabled in their final positions, and Create Goal and Planning Settings do not move when the list arrives

#### Scenario: A crowded mobile control row wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling
