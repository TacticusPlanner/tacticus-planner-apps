## RENAMED Requirements

- FROM: `### Requirement: Planning Settings is a Goals-only control`
- TO: `### Requirement: Planning Settings appears on Goals, not on Projects or Insights`

## MODIFIED Requirements

### Requirement: Planning Settings appears on Goals, not on Projects or Insights

The Plan section SHALL render its Planning Settings entry point on the Goals subpage. Projects and Insights SHALL NOT render a Planning Settings entry point of their own. The Schedule and Raids entry points are defined by `planning-settings-access`; every entry point opens the same dialog over the same persisted setting.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Projects or Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: Project-aware browsing defaults to all goals

Insights and every Dailies page that offers the shared project selector (Shops, Arena, Onslaught, Salvage Run) SHALL initially show all goals ("All goals"), using the global priority order and the one account-wide allocation. Choosing a project narrows the global result as `global-goal-priority` ("One global active sequence drives all execution surfaces") requires; clearing it SHALL restore "All goals". The choice SHALL NOT be persisted across a full page reload and SHALL NOT be changed by the Goals page's project scope. No project SHALL be pre-selected because of any project's type or status, including the Default project.

#### Scenario: Insights opens on all goals

- **GIVEN** the account has a Default project and other projects
- **WHEN** the user opens Insights with no earlier selection this session
- **THEN** Insights shows all goals with "All goals" selected in its project selector

#### Scenario: Browsing a project does not set the filter

- **GIVEN** the user opens `/plan/goals?project={B}`
- **WHEN** they later open Insights
- **THEN** Insights shows "All goals", not project B

#### Scenario: Reload resets the filter

- **GIVEN** the user selected project B on Shops
- **WHEN** they reload the page and open Shops
- **THEN** Shops shows "All goals"

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the reorder-mode toggle (always present; disabled while goals load or when reordering is unavailable), the select-mode toggle (`goal-bulk-actions`; always present, disabled while goals load or when no row is visible), the order info affordance, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers in a third row, each retaining an accessible name for its full label. Because every control in this row is present from the first render, the row SHALL NOT shift when goals finish loading. The bulk actions themselves SHALL NOT render in this row; they live in the select-mode bottom bar. When the controls do not fit one line (for example at 360px, and with the density control (`goal-list-layout`)), the row SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

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

### Requirement: Goals list controls are URL state

The Goals status filter and Type filter SHALL be the `status` and `type` query parameters of `/plan/goals`, written by replacing the current history entry. A missing parameter means the control's default (status Unfulfilled, all types); an unrecognized value is treated as the default and dropped from the URL. The Group selection stays persisted per browser, not in the URL.

#### Scenario: Reload keeps the filters

- **GIVEN** the user set the status filter to Reached and the Type filter to Rank on `/plan/goals`
- **WHEN** they reload the page
- **THEN** the URL still carries `status` and `type`, the status filter reads Reached, the Type filter reads Rank, and the list is filtered accordingly

#### Scenario: Filter links are shareable

- **WHEN** the user opens `/plan/goals?project={id}&status=paused`
- **THEN** the list shows that project's Paused goals with the status filter reading Paused and that project's chip selected

#### Scenario: Changing a filter adds no history entry

- **GIVEN** the user is on `/plan/goals` having arrived from `/home`
- **WHEN** they change the status filter twice and then press Back
- **THEN** Back returns to `/home`

#### Scenario: Unknown filter value falls back to the default

- **WHEN** the user opens `/plan/goals?status=nope`
- **THEN** the status filter reads Unfulfilled, the list shows Unfulfilled goals, and the URL is replaced without the `status` parameter

#### Scenario: Fresh load without parameters uses the defaults

- **WHEN** the user opens `/plan/goals` with no `status` or `type` parameter
- **THEN** the status filter reads Unfulfilled and the Type filter all types
