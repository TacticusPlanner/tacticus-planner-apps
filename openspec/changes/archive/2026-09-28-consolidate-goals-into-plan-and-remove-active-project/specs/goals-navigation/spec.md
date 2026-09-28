## RENAMED Requirements

- FROM: `### Requirement: Overview's controls share one row on desktop`
- TO: `### Requirement: Goals controls share one row on desktop`

- FROM: `### Requirement: Overview's controls compress on mobile`
- TO: `### Requirement: Goals controls compress on mobile`

- FROM: `### Requirement: Overview's project filter is not a project selector`
- TO: `### Requirement: Goals project filter is not a project selector`

- FROM: `### Requirement: Planning Settings is an Overview-only control`
- TO: `### Requirement: Planning Settings is a Goals-only control`

## MODIFIED Requirements

### Requirement: Goals controls share one row on desktop

At or above the 768px desktop breakpoint, Goals SHALL render the status filter, the Type/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control in a single row.

#### Scenario: Desktop Overview renders one control row

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** the status filter, Type/Group filters, project-membership filter, contextual Create Goal action, and Planning Settings control all appear in the same row, with no other row of controls above or below it

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the project-membership filter, the reorder-mode toggle (shown only when reordering is available), the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers, each retaining an accessible name for its full label. When the controls do not fit one line (for example at 360px, and with the density control from `add-goals-overview-density-option`), the row SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the status filter renders in a row separate from the Type/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

#### Scenario: The mobile reorder toggle is a control-row icon

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** an icon-only reorder-mode toggle with an accessible name appears in the same control row, and it is absent when reordering is unavailable

#### Scenario: A crowded mobile control row wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling

### Requirement: Planning Settings is a Goals-only control

The Goals section SHALL render its Planning Settings entry point only on the Goals subpage. Projects and Insights SHALL NOT render a Planning Settings entry point of their own.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Projects or Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: Goals project filter is not a project selector

The Goals page's project-membership filter SHALL NOT be treated as a project selector for the purposes of the "Consistent project selector" and "Project selector position" requirements: it chooses no project for any view to operate on, and only narrows a displayed list. It SHALL therefore render within the Type/Group filter group rather than trailing in the status-control row, and SHALL NOT be required to present the Default marker.

#### Scenario: The filter sits with the other filters

- **WHEN** Goals renders its controls at either breakpoint
- **THEN** the project-membership filter renders within the Type/Group filter group and not in the status filter's own row

#### Scenario: No selector markers are required

- **WHEN** the project-membership filter lists projects
- **THEN** it may list them without a Default marker without violating the consistent-project-selector requirement

## REMOVED Requirements

### Requirement: Current plan supplies the implicit project selection

**Reason**: There is no Current plan (Active project) any more; a browsing preference that selects nothing executable was more confusing than useful.

**Migration**: Project-aware browsing views default to all goals (see "Project-aware browsing defaults to all goals"); the project selector is an optional filter.

### Requirement: Overview's project filter is independent of the persisted project selection

**Reason**: The Current plan marker and its scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

### Requirement: Consistent project selector

**Reason**: The Current plan marker and its scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: Project-aware browsing defaults to all goals

Insights and every Dailies page that offers the shared project selector (Shops, Arena, Onslaught, Salvage Run) SHALL initially show all goals ("All goals"), using the global priority order and the one account-wide allocation. Choosing a project SHALL only filter or summarize that project's goals from the global result; clearing it SHALL restore "All goals". The choice SHALL NOT be persisted across a full page reload and SHALL NOT be changed by browsing to a project's detail route or by the Goals page's own project filter. No project SHALL be pre-selected because of any project's type or status, including the Default project.

#### Scenario: Insights opens on all goals

- **GIVEN** the account has a Default project and other projects
- **WHEN** the user opens Insights with no earlier selection this session
- **THEN** Insights shows all goals with "All goals" selected in its project selector

#### Scenario: A project filter narrows without re-planning

- **WHEN** the user selects project B on Insights or Shops
- **THEN** results shown are project B's goals' outcomes from the global run, and Today's schedule is unchanged

#### Scenario: Browsing a project does not set the filter

- **GIVEN** the user opens project B's detail route
- **WHEN** they later open Insights
- **THEN** Insights shows "All goals", not project B

#### Scenario: Reload resets the filter

- **GIVEN** the user selected project B on Shops
- **WHEN** they reload the page and open Shops
- **THEN** Shops shows "All goals"

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order and SHALL NOT offer a Sort control or any other sort mode. Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, and Insights, and no Global Plan or All Goals entry

#### Scenario: No sort control

- **WHEN** the user opens Goals
- **THEN** the controls offer status, Type, project-membership filters and Group, and no Sort control

### Requirement: Goals project filter is independent of the project selection

The Goals page's project-membership filter SHALL NOT read from or write to the project selection that project-aware Dailies and Insights views share. Changing it SHALL NOT change which project any calculating view operates on.

#### Scenario: Goals filtering leaves Dailies untouched

- **GIVEN** a project is selected in Dailies
- **WHEN** the user filters Goals by a different project
- **THEN** Dailies continues to operate on its own previously selected project

#### Scenario: Goals filtering leaves Insights untouched

- **GIVEN** Insights has project A selected
- **WHEN** the user filters Goals by project B
- **THEN** Insights still has project A selected

### Requirement: Project selectors mark the Default project consistently

Every Goals or Dailies subpage that includes a project selector SHALL use the shared project-selector component and SHALL mark the Default project consistently. Project color and the Default marker SHALL be presented consistently everywhere the selector appears. A selector that filters an otherwise all-goals view SHALL offer an "All goals" choice as its cleared state.

#### Scenario: Insights uses the shared project selector

- **WHEN** the user opens Insights
- **THEN** its project selector uses the shared presentation, including project color and the Default marker, and offers "All goals"

#### Scenario: Goal lifecycle status is not confused with project markers

- **WHEN** a goal with lifecycle status `Active` is shown near a project selector
- **THEN** the goal status remains labeled "Active" and no project is labeled Active or Current plan
