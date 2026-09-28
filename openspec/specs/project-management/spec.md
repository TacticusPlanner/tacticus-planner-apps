# project-management Specification

## Purpose

Makes Projects a list/detail pair of routes: `/goals/projects` for browsing, creating, and managing projects, and `/goals/projects/{id}` for one project's own row plus its goal table — separating "manage a project" from "choose which project's goals to view" into two distinct routes instead of two controls competing for the same page.

## Requirements

### Requirement: A project row navigates to its detail route

Activating a project card outside its controls SHALL navigate to its detail route. Card controls SHALL NOT navigate.

#### Scenario: Card opens detail

- **WHEN** the user activates a project card outside its controls
- **THEN** `/plan/projects/{id}` opens

#### Scenario: Card action does not navigate

- **WHEN** the user invokes an overflow action
- **THEN** that action runs without also opening the card

#### Scenario: Clicking a row opens its detail route

- **WHEN** the user activates a project card outside its action controls
- **THEN** the app navigates to that project's `/plan/projects/{id}` route

#### Scenario: Clicking an action icon does not navigate

- **WHEN** the user activates an Edit, Archive, or Restore menu item
- **THEN** that action runs without navigating away from the dashboard

### Requirement: Creating and editing a project uses a form Sheet

The list route SHALL provide a "New project" affordance and, on each project row (list or detail), an "Edit" action. Both SHALL open the same form (name, description, color) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the current route.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

### Requirement: No bulk pause/resume on Projects

Neither route SHALL provide a control that pauses or resumes every goal in a project at once. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens either the list or detail route
- **THEN** no "Pause all" or "Resume all" control is rendered

### Requirement: The detail route's project selector switches which project's detail route is shown

The project switcher SHALL be integrated into the detail header/navigation area. Changing it SHALL navigate to the selected project's route.

#### Scenario: Switcher changes only viewed project

- **GIVEN** project B is viewed
- **WHEN** the user switches to project C
- **THEN** project C's route opens

#### Scenario: Changing the selector navigates to a different project's detail route

- **GIVEN** the user is on project A's detail route
- **WHEN** the user changes the project switcher to project B
- **THEN** the app navigates to project B's detail route

#### Scenario: Acting on a different project's row does not navigate

- **GIVEN** the user is on project A's detail route
- **WHEN** the detail header renders
- **THEN** no other project row is available to act on without first switching routes

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

### Requirement: The list route has no redundant page heading

The list route SHALL NOT render its own "Projects" (or equivalent) page title — the shared section header already identifies the page.

#### Scenario: No duplicate title renders

- **WHEN** the user opens the list route
- **THEN** the page's own content contains no repeated "Projects" heading beyond the shared section header above it

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and available goal/unit summary information. Where summary data is available a card SHALL also show reached, blocked, and estimate/progress information; the richer dashboard metrics (reached, blocked, completion date) belong to the Default project card only, as they belonged to the Current plan project before it was removed, and are computed from the one global run. Identity and actions SHALL remain usable while each summary independently loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** one project's summary fails
- **THEN** only that card shows unavailable/retry state

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

### Requirement: Goal order drives priority-sensitive calculations

The project-goal list SHALL be a filtered projection of the canonical global order. Dailies, Raids Plan, Insights, and farming estimates SHALL run over all Active goals globally once; project views SHALL show filtered results from that run without independently sorting or reallocating resources.

#### Scenario: Shared inventory follows goal order across units

- **GIVEN** two Active goals in different projects need the same resource and owned inventory covers only the globally higher-priority goal
- **WHEN** planning is calculated
- **THEN** that goal receives the inventory first regardless of unit or project

### Requirement: The detail route assembles membership in bulk

The detail route SHALL provide a project-context action that edits memberships for multiple existing goals without visiting each goal individually. The surface SHALL list the profile's goals in account-wide priority order (`Goal.GlobalPriority`), with search and grouping by unit or goal type; it SHALL NOT offer a separate sort. It SHALL distinguish current membership from pending additions and removals and SHALL show a review summary before one explicit save. The save SHALL apply the complete reviewed set atomically. A stale-set, occupied-slot, or last-membership rejection SHALL identify the problem, preserve the draft, and allow the user to refresh/reconcile before retrying. Membership changes SHALL NOT change goal status, target, or canonical global priority.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user is on a project's detail route
- **WHEN** they select three nonmember goals and save
- **THEN** all three belong to the project and every unchanged membership remains

#### Scenario: Existing membership is visible while assembling

- **GIVEN** the project already contains some listed goals
- **WHEN** the surface renders
- **THEN** current membership and any pending add/remove state are visibly distinguishable

#### Scenario: Search narrows the assembly list

- **WHEN** the user searches by unit or goal type or changes the grouping
- **THEN** matching goals are shown without clearing pending selections hidden by the filter

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** the project's membership changed elsewhere after the surface was opened
- **WHEN** the user submits the reviewed set
- **THEN** no replacement occurs; the user sees a stale-set conflict and can compare refreshed current membership with their preserved draft before retrying

#### Scenario: Assembly does not remove members

- **WHEN** the user leaves existing members selected and saves additions
- **THEN** those existing members remain; only members explicitly marked for removal are removed

#### Scenario: Added goals do not reorder existing units

- **GIVEN** goals have an established canonical account-wide order
- **WHEN** the user adds or removes project memberships and saves
- **THEN** the canonical order and relative position of every goal remain unchanged, and a newly added goal appears in the project at its existing global position

#### Scenario: Several removals and additions in one save

- **WHEN** the user marks two current members for removal, three goals for addition, reviews the summary, and saves
- **THEN** all five membership changes commit together or none commits if any validation fails

#### Scenario: Removing the only membership is blocked

- **WHEN** a pending removal would leave a goal in no project
- **THEN** the save is rejected without applying other changes and the affected goal is identified with guidance to add it to another project first (the Default project is always available)

#### Scenario: Pending selection survives navigation within the list

- **WHEN** the user filters, groups, or scrolls the list after making selections
- **THEN** the review summary and eventual saved set retain those selections

### Requirement: Assembly blocks a selection whose goal-type slot is occupied

A project permits distinct Active/Paused Rank end targets but at most one in-flight goal per non-Rank unit/type slot or exact Rank unit/normalized-target slot. A save that would violate a slot SHALL be rejected in full. The assembly surface SHALL identify a listed goal whose exact slot is already held, prevent it from being selected, and state the reason. It SHALL permit a different Rank target for the same unit.

#### Scenario: Conflicting goal cannot be selected

- **GIVEN** the project contains an Active Bellator Silver3 Rank goal
- **WHEN** assembly lists another active Bellator Silver3 goal
- **THEN** that exact-target goal cannot be selected, with the existing milestone named

#### Scenario: A conflict arising after the check rejects the whole save

- **GIVEN** several goals are selected and one exact slot becomes occupied after preview
- **WHEN** the user saves
- **THEN** nothing is added, the conflict is explained, and the selection stays available to correct

#### Scenario: Historical goal in the project does not block selection

- **GIVEN** the project has only Completed/Archived Bellator Silver3 goals
- **WHEN** assembly lists an active Bellator Silver3 goal
- **THEN** it can be selected and saved

#### Scenario: Different target is selectable

- **GIVEN** the project contains Bellator Silver3
- **WHEN** assembly lists Bellator Gold1
- **THEN** Gold1 can be selected and saved

### Requirement: Project goal rows offer removal alongside deletion

On the detail route, each goal row's action menu SHALL offer removing that goal from the viewed project in addition to deleting it. Removal SHALL take effect on the viewed project only. After a removal the row SHALL leave the viewed list, and the outcome SHALL be reported naming the goal and, when the goal was relocated, its destination project.

#### Scenario: A goal row offers both actions

- **WHEN** a goal row's action menu is opened on a project's detail route
- **THEN** both a project-removal action and an account-wide delete action are offered

#### Scenario: Removed goal leaves the viewed list

- **GIVEN** a goal is listed on project A's detail route
- **WHEN** it is removed from project A
- **THEN** it no longer appears in project A's list and the outcome is reported

#### Scenario: Relocation destination is reported

- **GIVEN** the removed goal's only membership was project A
- **WHEN** the removal completes
- **THEN** the reported outcome names the project the goal was relocated to

### Requirement: Project detail groups goals by the selected dimension

Project detail SHALL render its goals grouped by the dimension selected in its Group control. The control SHALL offer no grouping and grouping by goal type; it SHALL NOT offer grouping by unit. When grouping by goal type, each group SHALL carry a heading identifying it; when grouping is off, the goals SHALL render as one list with no heading. Grouping SHALL apply to whichever goals the current status filter shows, and SHALL NOT alter stored goal priority.

#### Scenario: A project opens grouped by goal type

- **GIVEN** a project containing goals of several types
- **WHEN** its detail route is first opened
- **THEN** the goals are grouped by goal type, each group labelled with its type

#### Scenario: Grouping can be turned off

- **WHEN** the user selects no grouping
- **THEN** the project's goals render as a single ungrouped list with no group heading

#### Scenario: Grouping applies to archived goals too

- **GIVEN** the Archived status filter is selected
- **WHEN** grouping by goal type is selected
- **THEN** the archived goals are grouped by goal type rather than rendered flat

#### Scenario: Grouping leaves priority untouched

- **GIVEN** a project whose goals are in an established priority order
- **WHEN** the user changes the Group selection
- **THEN** the visible presentation changes and the stored goal order does not

#### Scenario: No unit grouping option is offered

- **WHEN** the Group control renders on a project's detail route
- **THEN** its options are limited to no grouping and grouping by goal type, with no "by unit" option present

### Requirement: Historical goals stay outside the in-flight ordering

Completed and Archived goals SHALL remain discoverable through the status filter, and SHALL NOT take part in the ordering that expresses the project's in-flight goal priority.

#### Scenario: Same unit has historical goals

- **GIVEN** a unit has Completed or Archived goals as well as in-flight ones
- **WHEN** the user selects the corresponding status filter
- **THEN** those goals are shown without taking a position in the project's in-flight goal priority ordering

### Requirement: The detail route's browsing controls persist across projects

The status and Group selections SHALL persist when the user switches to another project through the detail route's project switcher, so that a chosen way of reading a project carries across projects. Goal type SHALL be the Group selection the first time the detail route is opened in a browser, and persists across page reloads after that (not only within the current session). A Group selection of "by unit" persisted from before grouping by unit was removed from this route SHALL be treated as goal type on this route.

#### Scenario: Group selection carries to the next project

- **GIVEN** the user is viewing project A with no grouping selected
- **WHEN** they switch to project B through the project switcher
- **THEN** project B is also shown with no grouping selected

#### Scenario: Goal type is the initial grouping

- **GIVEN** the user has never changed the Group selection in this browser
- **WHEN** they open a project's detail route
- **THEN** its goals are grouped by goal type

#### Scenario: A previously persisted unit grouping falls back to goal type

- **GIVEN** the browser has a persisted Group selection of "by unit" from before this route stopped offering it
- **WHEN** the user opens a project's detail route
- **THEN** its goals render grouped by goal type, not by unit, and the Group control shows "Group By" set to goal type

### Requirement: Project detail presents its goals as a selection of the account's goals

Project detail SHALL express how many goals the project contains relative to how many goals the account has, so that a project reads as a subset rather than as the whole goal list. Both numbers SHALL count the same set of goals — every goal that is not Archived — so that the project's number can never exceed the account's. Archived goals SHALL remain counted by the Archived status filter. When the account total is not yet known, the project's own count SHALL still render and SHALL NOT be presented against a guessed or zero total. When the project contains no goals, the empty state SHALL say that the project is empty rather than that the account has no goals, and SHALL point at the surfaces that fill it.

#### Scenario: A project's goal count is relative to the account

- **GIVEN** the account has 40 non-archived goals and the viewed project contains 12 of them
- **WHEN** project detail renders its summary
- **THEN** the summary conveys that the project holds 12 of the account's 40 goals

#### Scenario: Archived members are excluded from both sides

- **GIVEN** a project whose members are 12 non-archived goals and 6 archived ones, in an account with 40 non-archived goals
- **WHEN** project detail renders its summary
- **THEN** the summary reports 12 of 40, not 18 of 40, and the 6 archived goals remain counted by the Archived status filter

#### Scenario: The account total is still loading

- **GIVEN** the account's goal list has not loaded
- **WHEN** project detail renders its summary
- **THEN** the project's own goal count renders without an account total, and no total of zero is shown

#### Scenario: An empty project explains itself

- **GIVEN** the viewed project contains no goals while the account has goals elsewhere
- **WHEN** project detail renders
- **THEN** the empty state states that this project has no goals yet and identifies adding existing goals or creating a goal as the ways to fill it

#### Scenario: Membership is not described as activation

- **WHEN** project detail renders its summary and empty state
- **THEN** no copy states or implies that belonging to this project makes a goal active, or that leaving it makes a goal inactive

### Requirement: The detail route offers a Create Goal action alongside Add Goals

The detail route SHALL provide a Create Goal action alongside its existing Add Goals action. Where Add Goals assigns an existing, currently-unassigned goal to the viewed project, Create Goal SHALL start a brand-new goal already scoped to the viewed project. Both actions SHALL be visible without hovering, focusing, or opening another control.

#### Scenario: Create Goal is offered next to Add Goals

- **WHEN** a project's detail route renders its header
- **THEN** a Create Goal action is visible next to the existing Add Goals action

#### Scenario: Create Goal starts a new goal scoped to the project

- **WHEN** the user activates Create Goal on a project's detail route
- **THEN** the goal-creation sheet opens with that project preselected, distinct from the existing-goal assembly surface Add Goals opens

#### Scenario: Project menu offers the same scoped creation

- **WHEN** the user opens Project Detail's three-dot menu
- **THEN** Create new goal is available there and opens goal creation with the viewed project preselected

#### Scenario: Add Goals offers creation without changing assignment semantics

- **WHEN** the user opens Add Goals on a project
- **THEN** Create new goal is a distinct action from selecting existing goals and saving their membership

### Requirement: The Default project is permanent

Every account SHALL have exactly one Default project. It SHALL be renamable and editable like any project, SHALL NOT be archived or deleted (no control offers either), and SHALL be the fallback home of a goal whose last other membership is removed. It SHALL be listed first wherever projects are listed and SHALL carry a Default marker. No other project SHALL carry a special status: there is no Active or Current plan project.

#### Scenario: Default project cannot be archived

- **WHEN** the Default project's action menu renders
- **THEN** Archive is unavailable with explanatory text and no delete action exists

#### Scenario: Default project can be renamed

- **WHEN** the user edits the Default project's name
- **THEN** the new name is saved and it remains the Default project, listed first

#### Scenario: No project is special beyond Default

- **WHEN** any project surface renders
- **THEN** it shows no Active, Current plan, or Make current label or control for any project

#### Scenario: A goal's last membership is removed

- **WHEN** a goal's last non-Default membership is removed
- **THEN** the client has already added the Default project membership (the API itself rejects removing a goal's only remaining membership), so the goal remains a member of the Default project

### Requirement: Project detail links to Goals

The project detail route SHALL link to the Goals page (`/plan/goals`) with copy explaining that project order is a view of the account-wide priority order shown there. The link SHALL be reachable at both breakpoints, including while the mobile reorder mode is on.

#### Scenario: Link to Goals

- **WHEN** a user opens a project's detail route
- **THEN** a link to `/plan/goals` is visible and describes the shared order

### Requirement: Projects has list and detail routes under /plan/projects

The system SHALL present the project dashboard at `/plan/projects` and an owned project's grouped goal detail at `/plan/projects/{id}`.

#### Scenario: Dashboard and detail remain addressable

- **WHEN** the user opens either project route
- **THEN** the requested dashboard or project detail renders at its stable URL

#### Scenario: The list route shows every project

- **WHEN** the user navigates to `/plan/projects`
- **THEN** the project dashboard renders, with no single project's goal table shown

#### Scenario: The detail route shows one project

- **WHEN** the user navigates to `/plan/projects/{id}` for a project they own
- **THEN** that project's semantic header renders above its grouped goal content

### Requirement: The list route shows every project, Default first, without its goal table

The dashboard SHALL show the Default project first, other non-archived projects after it, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain a project as a named selection of account goals whose displayed order is a projection of global priority, and the Default project as the permanent home of goals that belong to no other project. The explanation SHALL be visible on arrival at both breakpoints. The dashboard SHALL NOT render a goal table.

#### Scenario: The Default project is immediately identifiable

- **WHEN** the dashboard renders
- **THEN** the Default project appears first with a visible Default label

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

#### Scenario: The explanation is not hidden behind an interaction

- **WHEN** the dashboard renders at either breakpoint
- **THEN** the explanation is readable without hover, focus, or opening a control

### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu

Project actions SHALL no longer render as an always-visible inline icon cluster. Edit and Archive/Restore SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for the Default project, which is permanent (see "The Default project is permanent").

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit and Archive or Restore actions appear with text labels

#### Scenario: Archiving a project

- **GIVEN** a custom (non-default) project
- **WHEN** the user activates Archive from its action menu
- **THEN** the project moves to the archived section and offers Restore

#### Scenario: Restoring an archived project

- **GIVEN** an archived project
- **WHEN** the user activates Restore from its action menu
- **THEN** the project returns to the available-project section

#### Scenario: Archive is unavailable for the Default project

- **GIVEN** the Default project
- **WHEN** its action menu renders
- **THEN** Archive is unavailable and explanatory text identifies the restriction

### Requirement: The detail route header replaces the list row

The detail route SHALL replace the reused list row with a semantic project header containing back navigation, identity, description, summary metrics, overflow management actions, and the project's browsing controls — a labeled project switcher, a labeled status filter, and a labeled Group control. Grouped goal content SHALL render below the header, not the browsing controls.

#### Scenario: Archiving from the detail route behaves like archiving from the list

- **GIVEN** the user is on an eligible project's detail route
- **WHEN** the user activates Archive from the header action menu
- **THEN** the project is archived with the same lifecycle result as archiving it from the dashboard

#### Scenario: Browsing controls render inside the header

- **GIVEN** the user opens a project's detail route
- **WHEN** the header renders
- **THEN** the project switcher, status filter, and Group control render together inside the header card, each with a visible label reading "Project", "Filter", and "Group By" respectively, and only the grouped goal content renders below the header

### Requirement: The project order note explains account-wide numbers

The project detail route's order note SHALL state that each number is the goal's position in the account-wide order, so a project's goals can show gaps such as 1, 3, 5. It SHALL keep the link to Goals from "Project detail links to Goals". The numbers themselves are specified by `goal-list-layout`'s "In-flight rows show their account-wide priority position".

#### Scenario: A project with gaps explains them

- **GIVEN** a project whose goals hold global positions 1, 3, and 5
- **WHEN** its detail route renders
- **THEN** the note explains that the numbers are positions in the account-wide order and links to Goals
