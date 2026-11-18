## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order by default and SHALL offer only the Sort options in "Goals sorts by priority or finish date". Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals. The Plan section's child pages are Goals, Projects, Insights, Schedule, and Event shop, in that order.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, Insights, Schedule, and Event shop, and no Global Plan or All Goals entry

#### Scenario: Sort offers two orders

- **WHEN** the user opens Goals for the first time on a device
- **THEN** the controls offer status, Type, project-membership filters, Group by and a Sort reading Priority, with Finish date as its only other option

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

### Requirement: Goals controls form one toolbar on desktop

At or above the 768px desktop breakpoint, Goals SHALL render, directly beneath the project scope chip row, the page toolbar (`app-page-layout`) and no other row of controls. Its Find slot SHALL hold, in order, the status filter, the Type filter and the Select goals button (`goal-bulk-actions`); its View slot SHALL hold Layout, Group by, Sort, Season fit and Collapse all; its Actions slot, at the far right, SHALL hold the filled Create Goal action. Planning Settings SHALL be the page header's Settings button. The bulk actions SHALL NOT render in the toolbar; they live in the select bar (`goal-bulk-actions`). When the window is too narrow for one line, the View and Actions slots SHALL wrap together under Find, still at the right, so Create Goal is never alone on a line.

#### Scenario: Desktop Goals renders one toolbar

- **WHEN** Goals is viewed at or above the 768px breakpoint outside select mode
- **THEN** the toolbar below the scope chip row holds the status filter, Type filter and Select goals on the left, Layout, Group by, Sort, Season fit and Collapse all toward the right, Create Goal at the far right, and no bulk actions; Settings sits at the right end of the page header

#### Scenario: Select goals opens the select bar

- **WHEN** the user presses Select goals
- **THEN** the select bar with Pause, Resume, Add to project and Delete appears at the bottom of the viewport, Select goals leaves the toolbar, and Done brings it back

## REMOVED Requirements

### Requirement: Goals explains its priority order compactly

**Reason**: The toolbar's info icon was one more control to find; the explanation belongs with the other first-run help.

**Migration**: The same explanation is a step of the Goals page tour, see "Goals explains its priority order in the page tour".
