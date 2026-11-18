# goals-navigation Specification

## Purpose

Defines the Goals section's shared header/toolbar behavior — where Planning Settings lives, the shared status filter control, and how the project selector is presented — so Goals, Projects, and Insights read as one consistent surface instead of three independently-built header layouts.

## Requirements

### Requirement: Planning Settings appears on Goals, not on Projects or Insights

The Plan section SHALL render its Planning Settings entry point on the Goals subpage. Projects and Insights SHALL NOT render a Planning Settings entry point of their own. The Schedule and Raids entry points are defined by `planning-settings-access`; every entry point opens the same dialog over the same persisted setting.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Projects or Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: Shared status filter control

Goals SHALL present the status filter — All statuses, Unfulfilled, Reached, Blocked, Active, Paused — as a single select control defaulting to All statuses, whether or not a project scope is selected. The control SHALL carry the accessible name "Goal status filter". "All statuses" SHALL list every non-archived goal in scope regardless of attainment or status, and is labelled so it is not confused with the project scope's "All goals". There SHALL be no "Archived" option. Each option except Blocked SHALL show its count of matching goals within the current project scope. The Reached option lists Reached goals in the same list presentation as every other option; Reached goals SHALL NOT be omitted from any option they otherwise match (see `goal-list-layout` for how a Reached row renders).

#### Scenario: Status filter defaults to All statuses

- **WHEN** the user opens Goals, with or without a project scope
- **THEN** the status filter shows "All statuses" as the selected value and the goal list shows every non-archived goal in that scope, reached or not

#### Scenario: Selecting a status filters the goal list

- **WHEN** the user selects "Reached" from the status filter
- **THEN** the goal list updates to show only Reached goals, and the control retains the selected value

#### Scenario: No Archived option

- **WHEN** the user opens the status filter
- **THEN** the options are All statuses, Unfulfilled, Reached, Blocked, Active and Paused, and no "Archived" option is offered

#### Scenario: All statuses shows reached and unreached goals together

- **GIVEN** an Active unfulfilled goal, a Paused goal, and a reached goal
- **WHEN** the user selects "All statuses" from the status filter
- **THEN** all three goals are listed, the option shows a count of 3, and the URL carries `status=all`

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

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then the page toolbar (`app-page-layout`). The toolbar's Find slot SHALL hold the status filter (with its reached-indicator), the Type filter, the Reorder toggle (always present; disabled while goals load or when reordering is unavailable, including while Sort is not Priority) and the Select goals button (`goal-bulk-actions`); the Type filter SHALL render as an icon-only trigger with an accessible name for its full label, and Reorder and Select goals SHALL show their icon and a text label. The View button SHALL sit at the top right of the toolbar and open a sheet holding Layout, Group by, Sort, Season fit and Collapse all, stacked and full width. Planning Settings SHALL be the page header's Settings icon button. Create Goal SHALL NOT render in the toolbar on mobile; the bottom navigation's Add goal button is the mobile entry point (`goal-creation-entry-points`). Because every control is present from the first render, the toolbar SHALL NOT shift when goals finish loading. The bulk actions themselves SHALL NOT render in the toolbar; they live in the select bar. When the Find controls do not fit one line (for example at 360px), they SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Goals order

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the scope chip row renders first, and the toolbar beneath it holds the status filter, Type filter, Reorder and Select goals, with the View button at its top right

#### Scenario: Mobile Reorder and Select goals carry text

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** Reorder and Select goals show an icon and a text label, the Type filter shows its icon only and remains identifiable via its accessible name, and the header's Settings button is an icon button named "Settings"

#### Scenario: Mobile View sheet

- **WHEN** the user taps View below the 768px breakpoint
- **THEN** a sheet titled "View options" opens with Layout, Group by, Sort, Season fit and Collapse all, and Done closes it

#### Scenario: The mobile Reorder toggle is in the toolbar

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** a Reorder toggle appears enabled in the toolbar, and it stays in place but disabled when reordering is unavailable

#### Scenario: The mobile toolbar does not shift while goals load

- **WHEN** Goals is viewed below the 768px breakpoint and the goal list is still loading
- **THEN** Reorder and Select goals render disabled in their final positions, and the View button does not move when the list arrives

#### Scenario: A crowded mobile toolbar wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the Find controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling

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

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order by default and SHALL offer only the Sort options in "Goals sorts by priority or finish date". Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals. The Plan section's child pages are Goals, Projects, Insights, Schedule, and Event shop, in that order.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, Insights, Schedule, and Event shop, and no Global Plan or All Goals entry

#### Scenario: Sort offers two orders

- **WHEN** the user opens Goals for the first time on a device
- **THEN** the controls offer status, Type, project-membership filters, Group by and a Sort reading Priority, with Finish date as its only other option

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

The status filter, Type filter, and Group selections SHALL persist unchanged when the user switches project scope, so a chosen way of reading goals carries across projects. The Group selection SHALL be persisted per browser under one key regardless of scope, defaulting to no grouping; the status filter SHALL default to All statuses and the Type filter to all types on a fresh load, whatever the scope.

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
- **THEN** the status filter reads All statuses, the Type filter all types, and the list is ungrouped

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

### Requirement: Project selector is trailing in its row

On any subpage that renders both a tab or status control and a project selector, the project selector SHALL be trailing (right-aligned) in the same row as that tab or status control. On a subpage with a project selector and no tab or status control (Insights, Schedule), the project selector SHALL be the first control of the page toolbar's Find slot (`app-page-layout`), with its text label at every width. No subpage is exempt.

#### Scenario: Project selector shares a row with tabs where both exist

- **WHEN** a subpage renders both a tab/status row and a project selector
- **THEN** the project selector appears trailing in that same row, not in a separate row

#### Scenario: Project selector sits in the toolbar when there is nothing to pair it with

- **WHEN** a subpage renders a project selector but no tab or status control (Goals Insights, Schedule)
- **THEN** the project selector is in the page toolbar's Find slot and shows its selected project's name, also below 768px

### Requirement: Goals project scope is not a project selector

The Goals page's project scope chip row SHALL NOT be treated as a project selector for the purposes of the "Consistent project selector" and "Project selector is trailing in its row" requirements: it chooses no project for any calculating view to operate on, and only narrows the displayed list. It SHALL therefore render as its own row above the control row rather than trailing in the status-control row, SHALL NOT be required to use the shared project-selector component, and SHALL NOT be required to present the Default marker beyond listing the Default project first.

#### Scenario: The chip row sits above the controls

- **WHEN** Goals renders at either breakpoint
- **THEN** the scope chips render in their own row above the status filter, and no project select renders in the control row

#### Scenario: No selector markers are required

- **WHEN** the scope chip row lists projects
- **THEN** it may show them as color-and-name chips without a Default marker without violating the consistent-project-selector requirement

### Requirement: Goals controls form one toolbar on desktop

At or above the 768px desktop breakpoint, Goals SHALL render, directly beneath the project scope chip row, the page toolbar (`app-page-layout`) and no other row of controls. Its Find slot SHALL hold, in order, the status filter, the Type filter and the Select goals button (`goal-bulk-actions`); its View slot SHALL hold Layout, Group by, Sort, Season fit and Collapse all; its Actions slot, at the far right, SHALL hold the filled Create Goal action. Planning Settings SHALL be the page header's Settings button. The bulk actions SHALL NOT render in the toolbar; they live in the select bar (`goal-bulk-actions`). When the window is too narrow for one line, the View and Actions slots SHALL wrap together under Find, still at the right, so Create Goal is never alone on a line.

#### Scenario: Desktop Goals renders one toolbar

- **WHEN** Goals is viewed at or above the 768px breakpoint outside select mode
- **THEN** the toolbar below the scope chip row holds the status filter, Type filter and Select goals on the left, Layout, Group by, Sort, Season fit and Collapse all toward the right, Create Goal at the far right, and no bulk actions; Settings sits at the right end of the page header

#### Scenario: Select goals opens the select bar

- **WHEN** the user presses Select goals
- **THEN** the select bar with Pause, Resume, Add to project and Delete appears at the bottom of the viewport, Select goals leaves the toolbar, and Done brings it back

### Requirement: Goals list controls are URL state

The Goals status filter and Type filter SHALL be the `status` and `type` query parameters of `/plan/goals`, written by replacing the current history entry. A missing parameter means the control's default (status All statuses, all types); an unrecognized value is treated as the default and dropped from the URL. The Group selection stays persisted per browser, not in the URL.

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
- **THEN** the status filter reads All statuses, the list shows every non-archived goal, and the URL is replaced without the `status` parameter

#### Scenario: Fresh load without parameters uses the defaults

- **WHEN** the user opens `/plan/goals` with no `status` or `type` parameter
- **THEN** the status filter reads All statuses and the Type filter all types

### Requirement: Goals explains its priority order in the page tour

Goals SHALL NOT show a priority-order explanation in its toolbar or above the list. Its page tour's reorder step SHALL explain that goals are in the account-wide priority order, that dragging an Active or Paused goal moves it (on mobile, after tapping Reorder), that each drop saves at once and applies to every project, Today, Raids Plan and Insights, that in a project each number is the goal's account-wide position so numbers can skip, and that dragging needs Sort set to Priority.

#### Scenario: No info icon in the toolbar

- **WHEN** Goals renders at either breakpoint
- **THEN** the toolbar has no order info icon and no explanation paragraph renders above the list

#### Scenario: The tour explains the order

- **WHEN** the user runs the Goals page tour
- **THEN** its reorder step explains the account-wide order, where a move applies, the skipping numbers in a project, and that dragging needs Sort set to Priority

### Requirement: Goals sorts by priority or finish date

Goals SHALL offer **Sort** in the toolbar's View slot after Group by: a labelled segmented control (`app-page-layout`) with Priority (the account-wide priority order, the default) and Finish date (the estimated finish date in the plan, soonest first; goals without an estimate last, in priority order). The choice SHALL be remembered per device.

Group by SHALL follow the sort: groups appear in the order of their first goal in the sorted list, and goals inside a group keep the sorted order. Grouping SHALL NOT reorder goals by goal type.

Goals can be dragged only in priority order. While Sort is not Priority:

- drag handles, the row menu's move items and the mobile Reorder toggle SHALL be unavailable, and leaving Priority SHALL end reorder mode;
- while goals are listed, a notice above the list SHALL say that goals are sorted by finish date so they cannot be dragged to change their priority, with a **Sort by priority** action that sets Sort to Priority.

A stored grouping value that is no longer offered SHALL fall back to None.

#### Scenario: Finish date order

- **GIVEN** goals A (priority 1, finishing in 30 days), B (priority 2, finishing in 5 days) and C (priority 3, no estimate)
- **WHEN** the user sets Sort to Finish date
- **THEN** the list reads B, A, C and the choice is kept on the next visit from this device

#### Scenario: Type groups follow the sort

- **GIVEN** Group by Type and a priority order whose first goal is an Ability goal, then an Upgrade, a Rank and an Ascension goal
- **WHEN** Goals renders with Sort Priority
- **THEN** the groups read Ability, Upgrade, Rank, Ascension, each holding its goals in priority order

#### Scenario: The notice restores reordering

- **GIVEN** Sort is Finish date
- **WHEN** the user presses Sort by priority in the notice above the list
- **THEN** Sort reads Priority, the notice goes away and drag handles return
