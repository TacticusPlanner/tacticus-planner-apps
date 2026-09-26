## MODIFIED Requirements

### Requirement: The list route shows every project without its goal table

The dashboard SHALL show Current plan first, other non-archived projects separately, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain a project as a named selection of account goals whose displayed order is a projection of global priority, and Current plan as a browsing preference, not an execution scope. The explanation SHALL be visible on arrival at both breakpoints. The dashboard SHALL NOT render a goal table.

#### Scenario: Current plan is immediately identifiable

- **GIVEN** one owned project is Current plan
- **WHEN** the dashboard renders
- **THEN** it appears first with a visible Current plan label and browsing-context explanation

#### Scenario: Archived projects do not compete for focus

- **GIVEN** available and archived projects exist
- **WHEN** the dashboard initially renders
- **THEN** archived projects are grouped in a collapsed section

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the list route
- **THEN** every owned project remains available, including archived projects in their expandable section, and no goal table is rendered

#### Scenario: The dashboard says what a project is

- **WHEN** the dashboard renders with at least one project
- **THEN** visible copy describes projects as organizational selections sharing the account's global priority

#### Scenario: The dashboard says what Current plan changes

- **WHEN** the dashboard renders its Current plan section
- **THEN** visible copy says it is a browsing preference and does not activate goals or select a different execution plan

#### Scenario: The explanation is not hidden behind an interaction

- **WHEN** the dashboard renders at either breakpoint
- **THEN** the explanation is readable without hover, focus, or opening a control

### Requirement: Project detail shows every type in a fixed priority order

The detail route SHALL offer status and Group controls but no Type or Sort control. It SHALL show all member goals of the selected status in their canonical global relative order, subject to grouping. Group SHALL not change priority. The detail route SHALL offer reordering only as a move within that projection: it edits the global order (see the reorder requirements) and SHALL NOT imply an order of the project's own. It SHALL also link to Global Plan.

#### Scenario: No Type filter is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Type filter is rendered and goals of every type remain available under status/Group selection

#### Scenario: No Sort control is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Sort control is rendered and member goals follow global relative order

### Requirement: No project exists yet

When no projects exist, the dashboard SHALL explain that projects organize subsets of account goals without changing execution order and provide a prominent Create project action. It SHALL not render empty project sections or metrics.

#### Scenario: Empty dashboard teaches projects

- **WHEN** a user with no projects opens the dashboard
- **THEN** explanatory copy and Create project are shown without implying projects are alternative plans

#### Scenario: Empty project list prompts creation

- **WHEN** the user opens the dashboard with no projects
- **THEN** Create project appears without project sections, rows, metrics, or a goal table

### Requirement: Project management is deliberately responsive

At or above 768px, project cards SHALL use a comparison-friendly grid. Below 768px, cards and headers SHALL stack and primary actions SHALL remain labeled and touch-sized. Project detail SHALL show an accessible link to Global Plan at both breakpoints, alongside its own drag controls (at or above 768px) or reorder mode (below 768px).

#### Scenario: Desktop drag handle

- **WHEN** project detail renders at or above 768px
- **THEN** each in-flight goal row has a drag handle and Global Plan is reachable

#### Scenario: Mobile unit drag surface

- **WHEN** project detail renders below 768px
- **THEN** no separate drag Sheet appears; reordering uses the in-place reorder mode and Global Plan is reachable

#### Scenario: Mobile reorder mode replaces the unit-drag Sheet

- **WHEN** a mobile user wants to reorder from project detail
- **THEN** the route offers the in-place reorder mode, whose moves edit the global order, rather than opening a project-local Sheet

### Requirement: Goal order drives priority-sensitive calculations

The project-goal list SHALL be a filtered projection of the canonical global order. Dailies, Raids Plan, Insights, and farming estimates SHALL run over all Active goals globally once; project views SHALL show filtered results from that run without independently sorting or reallocating resources.

#### Scenario: Shared inventory follows goal order across units

- **GIVEN** two Active goals in different projects need the same resource and owned inventory covers only the globally higher-priority goal
- **WHEN** planning is calculated
- **THEN** that goal receives the inventory first regardless of unit or project

### Requirement: The detail route assembles membership in bulk

The detail route SHALL provide an action that adds existing goals to the viewed project without visiting each goal individually. The surface SHALL list profile goals, support search, show current membership, and apply additions in one save. Existing members SHALL remain members. Membership changes SHALL never alter global priority.

#### Scenario: Several goals join a project in one save

- **WHEN** the user selects three existing goals and saves
- **THEN** all three belong to the project and no other membership is lost

#### Scenario: Existing membership is visible while assembling

- **WHEN** the add-goals surface renders
- **THEN** each goal shows whether it already belongs to the viewed project

#### Scenario: Search narrows the assembly list

- **WHEN** the user enters search text
- **THEN** the list narrows to matching goals

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** membership changed elsewhere after the surface opened
- **WHEN** the user saves a selection
- **THEN** unrelated additions survive or a reviewable conflict prevents overwrite

#### Scenario: Assembly does not remove members

- **WHEN** the user saves an add-only selection
- **THEN** no existing member is removed

#### Scenario: Added goals do not reorder existing units

- **WHEN** an existing goal is added to the project
- **THEN** all goals retain their global priority and the new member appears at its already-established position

### Requirement: Goals are reordered individually via inline drag

On a viewport at or above 768px, every in-flight goal row on the project detail route SHALL show a drag handle. Dropping a row at another position of the displayed project list SHALL move that goal to the global position of the project goal it displaced, and hidden goals of other projects SHALL keep their relative order; the project list SHALL show the dragged goal at its new place. Each completed drag SHALL commit immediately with no separate save step or confirmation dialog. A goal MAY be dragged ahead of a goal it `DependsOn` that has not yet been reached; that goal's blocked/restricted state is unaffected by its position. The route SHALL state that the move also changes the global plan and SHALL link to it.

#### Scenario: Dragging a goal commits immediately

- **GIVEN** a project detail route with at least two in-flight goals
- **WHEN** the user drags one goal row to a new position and releases it
- **THEN** the new order is saved without any further confirmation step

#### Scenario: Reordering a subset moves the global order

- **GIVEN** global order A, B, C, D, E and a project showing A, C, E
- **WHEN** the user drags E above C
- **THEN** the project shows A, E, C and Global Plan shows A, B, E, C, D

#### Scenario: Dragging a goal down

- **GIVEN** global order A, B, C, D, E and a project showing A, C, E
- **WHEN** the user drags C below E
- **THEN** the project shows A, E, C and Global Plan shows A, B, D, E, C

#### Scenario: A goal can be moved ahead of its own unreached prerequisite

- **GIVEN** a Rank goal that `DependsOn` an unreached Ascension goal for the same unit
- **WHEN** the user drags the Rank goal above the Ascension goal
- **THEN** the drag succeeds, and the Rank goal's Restricted indicator (from `goal-blocker-reasons`) remains present, unaffected by the new position

#### Scenario: Stale order

- **WHEN** the global order changed after the project page loaded and a drag is submitted
- **THEN** the attempted move is kept, the order refreshes, and a reviewed retry is required, with no false success state

### Requirement: Mobile reordering uses a dedicated reorder mode

Below 768px, the project detail route SHALL offer a button that toggles a reorder mode. Activating it SHALL bring the list into view, collapse every goal card to its minimal identifying information and make each card directly draggable in place. There SHALL be no separate dialog, Sheet, or Save action: each completed drag SHALL commit immediately with the same move semantics as the desktop drag handle, and a Done control SHALL stay reachable while lower cards are moved. Deactivating the mode (via the same control, or navigating away) SHALL restore cards to their full, non-reorderable presentation. The mode SHALL state that moves also change the global plan.

#### Scenario: Entering reorder mode collapses cards

- **GIVEN** a project detail route below 768px with at least two in-flight goals
- **WHEN** the user activates the reorder button
- **THEN** every visible goal card collapses to its minimal information and becomes draggable

#### Scenario: A drag in reorder mode commits without a Save step

- **GIVEN** reorder mode is active
- **WHEN** the user drags one collapsed card to a new position
- **THEN** the move is saved immediately, with no Save button and no confirmation step, and the global order reflects it

#### Scenario: Exiting reorder mode restores full cards

- **GIVEN** reorder mode is active
- **WHEN** the user deactivates it
- **THEN** every card returns to its full, non-reorderable presentation
