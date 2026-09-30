# goals-navigation Specification

## Purpose

Defines the Goals section's shared header/toolbar behavior — where Planning Settings lives, the shared status filter control, and how the project selector is presented — so Overview, Projects, and Insights read as one consistent surface instead of three independently-built header layouts.

## Requirements

### Requirement: Planning Settings is a Goals-only control

The Plan section SHALL render its Planning Settings entry point on the Goals subpage and on the Schedule subpage (trailing Schedule's project selector). Projects and Insights SHALL NOT render a Planning Settings entry point of their own. Every entry point opens the same dialog over the same persisted setting.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings visible on Schedule

- **WHEN** the user opens Schedule
- **THEN** a Planning Settings control is visible after the project selector and opens the same planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Projects or Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: Shared status filter control

Goals SHALL present the status filter — Unfulfilled, Reached, Blocked, Active, Paused — as a single select control defaulting to Unfulfilled, whether or not a project scope is selected. There SHALL be no "Archived" option. Each option except Blocked SHALL show its count of matching goals within the current project scope. The Reached option lists Reached goals in the same list presentation as every other option; Reached goals SHALL NOT be omitted from any option they otherwise match (see `goal-list-layout` for how a Reached row renders).

#### Scenario: Status filter defaults to Unfulfilled

- **WHEN** the user opens Goals, with or without a project scope
- **THEN** the status filter shows "Unfulfilled" as the selected value and the goal list reflects only unfulfilled goals in that scope

#### Scenario: Selecting a status filters the goal list

- **WHEN** the user selects "Reached" from the status filter
- **THEN** the goal list updates to show only Reached goals, and the control retains the selected value

#### Scenario: No Archived option

- **WHEN** the user opens the status filter
- **THEN** the options are Unfulfilled, Reached, Blocked, Active and Paused, and no "Archived" option is offered

#### Scenario: Counts follow the scope

- **GIVEN** project B is selected and has 5 unfulfilled goals out of the account's 16
- **WHEN** the status filter's options render
- **THEN** Unfulfilled shows 5, not 16

### Requirement: Reached-goal indicator on the status filter

When there is at least one goal in the Reached status and the status filter's current selection is not "Reached", the status filter's trigger SHALL show a visual indicator that Reached goals exist. The indicator SHALL NOT be shown while "Reached" is the current selection, or when there are no goals in the Reached status.

#### Scenario: Indicator appears when Reached goals exist and are not being viewed

- **GIVEN** at least one goal has reached status and the status filter is currently set to "Unfulfilled"
- **WHEN** the page renders
- **THEN** the status filter's trigger shows the reached-goal indicator

#### Scenario: Indicator hidden while viewing Reached

- **GIVEN** at least one goal has reached status
- **WHEN** the status filter is set to "Reached"
- **THEN** the status filter's trigger does not show the indicator

#### Scenario: Indicator hidden when there are no reached goals

- **GIVEN** no goals currently have reached status
- **WHEN** the page renders with the status filter set to any value other than "Reached"
- **THEN** the status filter's trigger does not show the indicator

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the reorder-mode toggle (shown only when reordering is available), the select-mode toggle (`goal-bulk-actions`, shown whenever at least one row is visible), the order info affordance, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers in a third row, each retaining an accessible name for its full label. The bulk actions themselves SHALL NOT render in this row; they live in the select-mode bottom bar. When the controls do not fit one line (for example at 360px, and with the density control from `add-goals-overview-density-option`), the row SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the scope chip row renders first, the status filter renders in its own row beneath it, and the Type/Group filters, reorder and select toggles, order info affordance, contextual Create Goal action, and Planning Settings control render in a row beneath that

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type/Group filters, the select-mode toggle, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

#### Scenario: The mobile reorder toggle is a control-row icon

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** an icon-only reorder-mode toggle with an accessible name appears in the same control row, and it is absent when reordering is unavailable

#### Scenario: A crowded mobile control row wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling

### Requirement: Project-aware browsing defaults to all goals

Insights and every Dailies page that offers the shared project selector (Shops, Arena, Onslaught, Salvage Run) SHALL initially show all goals ("All goals"), using the global priority order and the one account-wide allocation. Choosing a project SHALL only filter or summarize that project's goals from the global result; clearing it SHALL restore "All goals". The choice SHALL NOT be persisted across a full page reload and SHALL NOT be changed by the Goals page's project scope. No project SHALL be pre-selected because of any project's type or status, including the Default project.

#### Scenario: Insights opens on all goals

- **GIVEN** the account has a Default project and other projects
- **WHEN** the user opens Insights with no earlier selection this session
- **THEN** Insights shows all goals with "All goals" selected in its project selector

#### Scenario: A project filter narrows without re-planning

- **WHEN** the user selects project B on Insights or Shops
- **THEN** results shown are project B's goals' outcomes from the global run, and Today's schedule is unchanged

#### Scenario: Browsing a project does not set the filter

- **GIVEN** the user opens `/plan/goals?project={B}`
- **WHEN** they later open Insights
- **THEN** Insights shows "All goals", not project B

#### Scenario: Reload resets the filter

- **GIVEN** the user selected project B on Shops
- **WHEN** they reload the page and open Shops
- **THEN** Shops shows "All goals"

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order and SHALL NOT offer a Sort control or any other sort mode. Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals. The Plan section's child pages are Goals, Projects, Insights, and Schedule, in that order.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, Insights, and Schedule, and no Global Plan or All Goals entry

#### Scenario: No sort control

- **WHEN** the user opens Goals
- **THEN** the controls offer status, Type, project-membership filters and Group, and no Sort control

### Requirement: Goals project filter is independent of the project selection

The Goals page's project scope SHALL NOT read from or write to the project selection that project-aware Dailies and Insights views share. Changing it SHALL NOT change which project any calculating view operates on.

#### Scenario: Goals filtering leaves Dailies untouched

- **GIVEN** a project is selected in Dailies
- **WHEN** the user scopes Goals to a different project
- **THEN** Dailies continues to operate on its own previously selected project

#### Scenario: Goals filtering leaves Insights untouched

- **GIVEN** Insights has project A selected
- **WHEN** the user scopes Goals to project B
- **THEN** Insights still has project A selected

### Requirement: Project selectors mark the Default project consistently

Every Goals or Dailies subpage that includes a project selector SHALL use the shared project-selector component and SHALL mark the Default project consistently. Project color and the Default marker SHALL be presented consistently everywhere the selector appears. A selector that filters an otherwise all-goals view SHALL offer an "All goals" choice as its cleared state.

#### Scenario: Insights uses the shared project selector

- **WHEN** the user opens Insights
- **THEN** its project selector uses the shared presentation, including project color and the Default marker, and offers "All goals"

#### Scenario: Goal lifecycle status is not confused with project markers

- **WHEN** a goal with lifecycle status `Active` is shown near a project selector
- **THEN** the goal status remains labeled "Active" and no project is labeled Active or Current plan

### Requirement: Goals project scope is URL state

The Goals page's project filter ("project scope") SHALL be the `project` query parameter of `/plan/goals`: `/plan/goals?project={id}` shows only goals that are members of that project, and `/plan/goals` with no parameter shows all goals. Selecting a scope on the page SHALL update the parameter by replacing the current history entry, so Back leaves the Goals page rather than stepping through scopes. The scope SHALL survive a reload and be shareable as a link. When the parameter names a project that is unknown, archived, or not the user's, the page SHALL show all goals with the "All goals" chip selected and drop the parameter from the URL (replace). While the project list is loading or has failed to load, the parameter SHALL be preserved in the URL and the list SHALL show all goals until membership is known.

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

### Requirement: Goals project scope chip row

Goals SHALL render, as the only row above its control row, a single horizontally scrollable row of scope chips: "All goals" first, then the Default project, then the other non-archived projects in the order the Projects dashboard uses. Archived projects SHALL NOT appear. Each project chip SHALL show the project's color, name, and its count of non-archived member goals; "All goals" SHALL show the count of all non-archived goals. Exactly one chip SHALL be selected at any time and SHALL be distinguishable without color alone. The row SHALL NOT offer New project, an All projects link, or any lifecycle action. This presentation SHALL be the same at and above 768px and below it: the row scrolls horizontally rather than wrapping, capping, or switching to a card widget. While projects are loading the row SHALL show a skeleton in place of the project chips; if they fail to load the row SHALL show only the "All goals" chip and no error message, since the goal list does not depend on it. With no projects, the row SHALL show only the "All goals" chip.

#### Scenario: Chips list every non-archived project with counts

- **GIVEN** the player has the Default project "My Goals" with 16 goals, "Neuro" with 5, and an archived project
- **WHEN** Goals renders at either breakpoint
- **THEN** the row reads All goals (16), My Goals (16), Neuro (5) in that order and the archived project is absent

#### Scenario: Many projects scroll rather than wrap

- **GIVEN** more projects than fit the row's width
- **WHEN** Goals renders at either breakpoint
- **THEN** the row scrolls horizontally, no chip is hidden or clipped, and the control row below it is unaffected

#### Scenario: Selecting a chip filters in place

- **WHEN** the user selects a project chip
- **THEN** the goal list narrows to that project's members without leaving `/plan/goals`, and selecting "All goals" restores the full list

#### Scenario: Loading and failure

- **WHEN** the project list is loading
- **THEN** skeleton chips render where the project chips will be
- **AND** if the project list fails to load, only the "All goals" chip renders and no error message appears in the row

### Requirement: Switching project scope preserves list controls

The status filter, Type filter, and Group selections SHALL persist unchanged when the user switches project scope, so a chosen way of reading goals carries across projects. The Group selection SHALL be persisted per browser under one key regardless of scope, defaulting to no grouping; the status filter SHALL default to Unfulfilled and the Type filter to all types on a fresh load, whatever the scope.

#### Scenario: Group selection carries across scopes

- **GIVEN** the user has Group set to goal type while viewing "All goals"
- **WHEN** they select project B's chip
- **THEN** project B's goals render grouped by goal type

#### Scenario: Status carries across scopes

- **GIVEN** the status filter is set to Reached
- **WHEN** the user switches from project A to project B
- **THEN** the status filter still reads Reached and lists project B's reached goals

#### Scenario: Fresh load defaults do not depend on scope

- **WHEN** the user opens `/plan/goals?project={id}` in a browser that has no persisted Group selection
- **THEN** the status filter reads Unfulfilled, the Type filter all types, and the list is ungrouped

### Requirement: Scoped Goals adjusts contextual actions and copy

While a project scope is selected, Goals' contextual Create goal action SHALL launch creation with that project preselected (see `goal-creation-entry-points`), and an empty scoped list caused by the project having no non-archived goals SHALL state that this project has no goals yet and point at Manage goals on the Projects page and Create goal as the ways to fill it, rather than the generic "no goals match" copy. A scoped list that is empty only because of the status or Type filter SHALL keep the generic filtered-empty copy. With "All goals" selected, none of this applies.

#### Scenario: Scoped Create goal preselects the project

- **GIVEN** project B is the selected scope
- **WHEN** the user activates Goals' Create goal action
- **THEN** the goal-creation sheet opens with project B preselected as the membership

#### Scenario: An empty project explains itself

- **GIVEN** project B has no non-archived goals
- **WHEN** the user selects project B's chip
- **THEN** the list area states that this project has no goals yet and names Manage goals (Projects page) and Create goal as the ways to fill it

#### Scenario: A filter-empty scoped list keeps the generic copy

- **GIVEN** project B has goals but none are Reached
- **WHEN** the user selects project B with the status filter set to Reached
- **THEN** the generic filtered-empty copy renders, not the empty-project copy

### Requirement: Goals explains its priority order compactly

Goals SHALL present its priority-order explanation as an info affordance in the control row (an icon with an accessible name whose content opens on click or tap and on keyboard focus) rather than a full-width paragraph, at both breakpoints. With "All goals" selected the content SHALL state that goals are in the account-wide priority order, that dragging an Active or Paused goal moves it, and that the change applies to every project, Today, Raids Plan, and Insights. With a project selected it SHALL additionally state that each number is the goal's position in the account-wide order, so a project's goals can show gaps such as 1, 3, 5, and that moving a goal here also moves it in that order. The affordance SHALL render only when reordering is available and the list is non-empty.

#### Scenario: Unscoped explanation

- **GIVEN** "All goals" is selected and at least two Active or Paused goals are listed
- **WHEN** the user opens the order info affordance
- **THEN** it explains the account-wide order and where a move applies, and no full-width paragraph is rendered above the list

#### Scenario: Scoped explanation adds the gap note

- **GIVEN** a project whose goals hold global positions 1, 3, and 5 is selected
- **WHEN** the user opens the order info affordance
- **THEN** it additionally explains that the numbers are positions in the account-wide order and may show gaps

#### Scenario: Reachable by keyboard and touch

- **WHEN** the affordance is focused with the keyboard at or above 768px, or tapped below 768px
- **THEN** its content is shown

### Requirement: Project selector is trailing in its row

On any subpage that renders both a tab or status control and a project selector, the project selector SHALL be trailing (right-aligned) in the same row as that tab or status control. On a subpage with a project selector and no tab or status control, the project selector SHALL be right-aligned alone. No subpage is exempt.

#### Scenario: Project selector shares a row with tabs where both exist

- **WHEN** a subpage renders both a tab/status row and a project selector
- **THEN** the project selector appears trailing in that same row, not in a separate row

#### Scenario: Project selector stands alone when there is nothing to pair it with

- **WHEN** a subpage renders a project selector but no tab or status control (Goals Insights)
- **THEN** the project selector is right-aligned in its own row

### Requirement: Goals project scope is not a project selector

The Goals page's project scope chip row SHALL NOT be treated as a project selector for the purposes of the "Consistent project selector" and "Project selector is trailing in its row" requirements: it chooses no project for any calculating view to operate on, and only narrows the displayed list. It SHALL therefore render as its own row above the control row rather than trailing in the status-control row, SHALL NOT be required to use the shared project-selector component, and SHALL NOT be required to present the Default marker beyond listing the Default project first.

#### Scenario: The chip row sits above the controls

- **WHEN** Goals renders at either breakpoint
- **THEN** the scope chips render in their own row above the status filter, and no project select renders in the control row

#### Scenario: No selector markers are required

- **WHEN** the scope chip row lists projects
- **THEN** it may show them as color-and-name chips without a Default marker without violating the consistent-project-selector requirement

### Requirement: Goals controls form an actions row and a filters row on desktop

At or above the 768px desktop breakpoint, Goals SHALL render, directly beneath the project scope chip row, first an actions row and then a filters row, and no other row of controls. The actions row SHALL contain, in order from the left: the contextual Create Goal action, then the bulk actions Pause, Resume, Add to project and Delete (`goal-bulk-actions`: disabled with an empty selection, labelled with the selected count otherwise), and at the far right the Planning Settings control. The filters row SHALL contain, in order: the status filter, the Type and Group filters, and the order info affordance. The bulk actions SHALL remain present, disabled, when nothing is selected rather than appearing only on selection, so the row does not change shape as the selection changes. Neither row SHALL wrap at or above 1024px with every control present.

#### Scenario: Desktop Goals renders two control rows

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** an actions row holding Create Goal, Pause, Resume, Add to project, Delete and Planning Settings appears immediately below the scope chip row, a filters row holding the status filter, Type/Group filters and order info affordance appears immediately below it, and no further control row renders

#### Scenario: The actions row keeps its shape with nothing selected

- **GIVEN** no goal is selected
- **WHEN** the actions row renders
- **THEN** Pause, Resume, Add to project and Delete are present and disabled, occupying the same positions they occupy with a selection
