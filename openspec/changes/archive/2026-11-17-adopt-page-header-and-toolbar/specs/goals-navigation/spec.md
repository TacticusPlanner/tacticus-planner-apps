## RENAMED Requirements

- FROM: `### Requirement: Goals controls form an actions row and a filters row on desktop`
- TO: `### Requirement: Goals controls form one toolbar on desktop`

## MODIFIED Requirements

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then the page toolbar (`app-page-layout`). The toolbar's Find slot SHALL hold the status filter (with its reached-indicator), the Type filter, the order info affordance, the reorder-mode toggle (always present; disabled while goals load or when reordering is unavailable) and the select-mode toggle (`goal-bulk-actions`; always present, disabled while goals load or when no row is visible); the Type filter and the toggles SHALL render as icon-only triggers, each retaining an accessible name for its full label. The View button SHALL sit at the top right of the toolbar and open a sheet holding Layout, Group by, Season fit and Collapse all, stacked and full width. Planning Settings SHALL be the page header's Settings icon button. Create Goal SHALL NOT render in the toolbar on mobile; the bottom navigation's Add goal button is the mobile entry point (`goal-creation-entry-points`). Because every control is present from the first render, the toolbar SHALL NOT shift when goals finish loading. The bulk actions themselves SHALL NOT render in the toolbar; they live in the select-mode bottom bar. When the Find controls do not fit one line (for example at 360px), they SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Goals order

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the scope chip row renders first, and the toolbar beneath it holds the status filter, Type filter, order info affordance and reorder and select toggles, with the View button at its top right

#### Scenario: Mobile filter controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type filter, the reorder-mode toggle and the select-mode toggle render their icon only, without visible text labels, while each remains identifiable via its accessible name, and the header's Settings button is an icon button named "Settings"

#### Scenario: Mobile View sheet

- **WHEN** the user taps View below the 768px breakpoint
- **THEN** a sheet titled "View options" opens with Layout, Group by, Season fit and Collapse all, and Done closes it

#### Scenario: The mobile reorder toggle is a toolbar icon

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** an icon-only reorder-mode toggle with an accessible name appears enabled in the toolbar, and it stays in place but disabled when reordering is unavailable

#### Scenario: The mobile toolbar does not shift while goals load

- **WHEN** Goals is viewed below the 768px breakpoint and the goal list is still loading
- **THEN** the reorder-mode and select-mode toggles render disabled in their final positions, and the View button does not move when the list arrives

#### Scenario: A crowded mobile toolbar wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the Find controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling

### Requirement: Goals explains its priority order compactly

Goals SHALL present its priority-order explanation as an info affordance in the page toolbar's Find slot (an icon with an accessible name whose content opens on click or tap and on keyboard focus) rather than a full-width paragraph, at both breakpoints. With "All goals" selected the content SHALL state that goals are in the account-wide priority order, that dragging an Active or Paused goal moves it, and that the change applies to every project, Today, Raids Plan, and Insights. With a project selected it SHALL additionally state that each number is the goal's position in the account-wide order, so a project's goals can show gaps such as 1, 3, 5, and that moving a goal here also moves it in that order. The affordance SHALL render only when reordering is available and the list is non-empty.

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

### Requirement: Goals controls form one toolbar on desktop

At or above the 768px desktop breakpoint, Goals SHALL render, directly beneath the project scope chip row, the page toolbar (`app-page-layout`) and no other row of controls. Its Find slot SHALL hold, in order, the status filter, the Type filter and the order info affordance; its View slot SHALL hold Layout, Group by, Season fit and Collapse all; its Actions slot, at the far right, SHALL hold the filled Create Goal action. Planning Settings SHALL be the page header's Settings button. While at least one goal is selected, the toolbar SHALL show a bulk actions row under its controls with Pause, Resume, Add to project and Delete (`goal-bulk-actions`); with nothing selected that row SHALL NOT render. When the window is too narrow for one line, the View and Actions slots SHALL wrap together under Find, still at the right, so Create Goal is never alone on a line.

#### Scenario: Desktop Goals renders one toolbar

- **WHEN** Goals is viewed at or above the 768px breakpoint with no goal selected
- **THEN** the toolbar below the scope chip row holds the status filter, Type filter and order info affordance on the left, Layout, Group by, Season fit and Collapse all toward the right, Create Goal at the far right, and no bulk actions row; Settings sits at the right end of the page header

#### Scenario: Selecting goals shows the bulk actions

- **GIVEN** no goal is selected
- **WHEN** the user selects two goals
- **THEN** a bulk actions row with Pause, Resume, Add to project and Delete appears under the toolbar controls, and it goes away when the selection is cleared
