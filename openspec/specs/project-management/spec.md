# project-management Specification

## Purpose

Makes Projects a list/detail pair of routes: `/goals/projects` for browsing, creating, and managing projects, and `/goals/projects/{id}` for one project's own row plus its goal table — separating "manage a project" from "choose which project's goals to view" into two distinct routes instead of two controls competing for the same page.

## Requirements

### Requirement: Projects has a list route and a single-project detail route

The system SHALL present the project dashboard at `/goals/projects` and an owned project's grouped goal detail at `/goals/projects/{id}`. Opening or switching the viewed detail SHALL NOT change Current plan unless the user explicitly invokes “Make current.”

#### Scenario: Dashboard and detail remain addressable

- **WHEN** the user opens either project route
- **THEN** the requested dashboard or project detail renders at its stable URL

#### Scenario: The list route shows every project

- **WHEN** the user navigates to `/goals/projects`
- **THEN** the project dashboard renders, with no single project's goal table shown

#### Scenario: The detail route shows one project

- **WHEN** the user navigates to `/goals/projects/{id}` for a project they own
- **THEN** that project's semantic header renders above its grouped goal content

#### Scenario: Browsing does not change Current plan

- **GIVEN** project A is Current plan
- **WHEN** the user opens project B
- **THEN** project A remains Current plan

### Requirement: The list route shows every project without its goal table

The dashboard SHALL show Current plan first, other non-archived projects separately, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain what a project is — a named, separately ordered selection of the account's goals — why an account may keep more than one, and that Current plan supplies the default context for Dailies and Insights. That explanation SHALL be visible on arrival at both breakpoints, not revealed only by hover, focus, or an opened menu. The dashboard SHALL NOT render a goal table.

#### Scenario: Current plan is immediately identifiable

- **GIVEN** one owned project is Current plan
- **WHEN** the dashboard renders
- **THEN** it appears first with a visible Current plan label and explanatory context

#### Scenario: Archived projects do not compete for focus

- **GIVEN** available and archived projects exist
- **WHEN** the dashboard initially renders
- **THEN** archived projects are grouped in a collapsed section

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the list route
- **THEN** every owned project remains available on the dashboard, including archived projects in their expandable section, and no goal table is rendered

#### Scenario: The dashboard says what a project is

- **GIVEN** the user has at least one project
- **WHEN** the dashboard renders
- **THEN** visible copy describes a project as a named selection of the user's goals with its own priority order, and describes what keeping more than one project is for

#### Scenario: The dashboard says what Current plan changes

- **WHEN** the dashboard renders its Current plan section
- **THEN** visible copy states that Current plan is the project Dailies and Insights use by default, and does not describe it as making goals active or inactive

#### Scenario: The explanation is not hidden behind an interaction

- **WHEN** the dashboard renders at either breakpoint
- **THEN** the project and Current plan explanations are readable without hovering, focusing, or opening any control

### Requirement: A project row navigates to its detail route

Activating a project card outside its controls SHALL navigate to its detail route. Card controls SHALL NOT navigate or implicitly change Current plan.

#### Scenario: Card opens detail

- **WHEN** the user activates a project card outside its controls
- **THEN** `/goals/projects/{id}` opens without changing Current plan

#### Scenario: Card action does not navigate

- **WHEN** the user invokes Make current or an overflow action
- **THEN** that action runs without also opening the card

#### Scenario: Clicking a row opens its detail route

- **WHEN** the user activates a project card outside its action controls
- **THEN** the app navigates to that project's `/goals/projects/{id}` route

#### Scenario: Clicking an action icon does not navigate

- **WHEN** the user activates Make current or an Edit, Archive, or Restore menu item
- **THEN** that action runs without navigating away from the dashboard

### Requirement: Creating and editing a project uses a form Sheet

The list route SHALL provide a "New project" affordance and, on each project row (list or detail), an "Edit" action. Both SHALL open the same form (name, description, color) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the current route.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

### Requirement: Project lifecycle actions render as inline icons on each row

Project actions SHALL no longer render as an always-visible inline icon cluster. A non-current available project SHALL expose a labeled “Make current” action. Edit and Archive/Restore SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for Current plan and the default project.

#### Scenario: Make another project current

- **GIVEN** project A is current and project B is available
- **WHEN** the user activates Make current on B
- **THEN** B becomes Current plan and moves to the prominent section without navigation

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit and Archive or Restore actions appear with text labels

#### Scenario: Setting a project active

- **GIVEN** a non-current available project
- **WHEN** the user activates its Make current action
- **THEN** that project becomes Current plan and its marker updates accordingly

#### Scenario: Archiving a project

- **GIVEN** a project that is neither the default project nor Current plan
- **WHEN** the user activates Archive from its action menu
- **THEN** the project moves to the archived section and offers Restore

#### Scenario: Restoring an archived project

- **GIVEN** an archived project
- **WHEN** the user activates Restore from its action menu
- **THEN** the project returns to the available-project section

#### Scenario: Archive is unavailable for the default or active project

- **GIVEN** a project that is the default project or Current plan
- **WHEN** its action menu renders
- **THEN** Archive is unavailable and explanatory text identifies the restriction

### Requirement: The detail route's current-project row matches the list route's row

The detail route SHALL replace the reused list row with a semantic project header containing back navigation, identity, description, Current plan state/action, summary metrics, a project switcher, and overflow management actions. Goal controls and grouped goal content SHALL render below it.

#### Scenario: Current detail has no redundant action

- **WHEN** the Current plan detail opens
- **THEN** its header identifies Current plan and omits Make current

#### Scenario: Non-current detail can become current

- **WHEN** an available non-current detail opens
- **THEN** its header offers Make current

#### Scenario: Archiving from the detail route behaves like archiving from the list

- **GIVEN** the user is on an eligible project's detail route
- **WHEN** the user activates Archive from the header action menu
- **THEN** the project is archived with the same lifecycle result as archiving it from the dashboard

### Requirement: No bulk pause/resume on Projects

Neither route SHALL provide a control that pauses or resumes every goal in a project at once. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens either the list or detail route
- **THEN** no "Pause all" or "Resume all" control is rendered

### Requirement: The detail route's project selector switches which project's detail route is shown

The project switcher SHALL be integrated into the detail header/navigation area. Changing it SHALL navigate to the selected project's route and SHALL NOT change Current plan.

#### Scenario: Switcher changes only viewed project

- **GIVEN** project A is Current plan and project B is viewed
- **WHEN** the user switches to project C
- **THEN** project C's route opens and A remains Current plan

#### Scenario: Changing the selector navigates to a different project's detail route

- **GIVEN** the user is on project A's detail route
- **WHEN** the user changes the project switcher to project B
- **THEN** the app navigates to project B's detail route without changing Current plan

#### Scenario: Acting on a different project's row does not navigate

- **GIVEN** the user is on project A's detail route
- **WHEN** the detail header renders
- **THEN** no other project row is available to act on without first switching routes

### Requirement: The detail route shares Overview's goal filters

The detail route SHALL continue to offer status, Type, Sort, and Group controls for normal browsing. Those controls SHALL NOT affect stored goal priority. Reordering SHALL occur only via drag — the inline per-row handle at or above 768px, or the dedicated mobile reorder mode below it — never as a side effect of Sort, Group, or Type.

#### Scenario: Browsing sort does not alter priority

- **WHEN** the user changes Sort or Group on project detail
- **THEN** the visible presentation changes but the stored goal order does not

#### Scenario: Type filter narrows the current project's goals

- **GIVEN** a project with goals of multiple types, shown on its detail route
- **WHEN** the user selects a specific Type filter
- **THEN** only that project's goals of the selected type are shown

#### Scenario: Group by unit groups the current project's goals

- **WHEN** the user selects Group by unit on a project's detail route
- **THEN** that project's goals are grouped by unit without altering stored goal priority

### Requirement: No project exists yet

When no projects exist, the dashboard SHALL explain that projects group unit goals into alternative prioritized plans and provide a prominent labeled Create project action. It SHALL not render empty project sections or metrics.

#### Scenario: Empty dashboard teaches projects

- **WHEN** a user with no projects opens the dashboard
- **THEN** explanatory copy and Create project are shown

#### Scenario: Empty project list prompts creation

- **GIVEN** the user has never created a project
- **WHEN** the user opens the dashboard
- **THEN** the prominent Create project action is shown without project sections, rows, metrics, or a goal table

### Requirement: The list route has no redundant page heading

The list route SHALL NOT render its own "Projects" (or equivalent) page title — the shared section header already identifies the page.

#### Scenario: No duplicate title renders

- **WHEN** the user opens the list route
- **THEN** the page's own content contains no repeated "Projects" heading beyond the shared section header above it

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and available goal/unit summary information. Current plan SHALL additionally show available reached, blocked, and estimate/progress information. Identity and actions SHALL remain usable while each summary independently loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** one project's summary fails
- **THEN** only that card shows unavailable/retry state

### Requirement: Project management is deliberately responsive

At or above 768px, project cards SHALL use a comparison-friendly grid and each goal row SHALL show an inline drag handle for direct reordering. Below 768px, cards and headers SHALL stack, primary actions SHALL remain labeled and touch-sized, and reordering SHALL use a dedicated reorder mode (see "Mobile reordering uses a dedicated reorder mode" below) rather than a dialog or Sheet.

#### Scenario: Desktop drag handle

- **WHEN** project detail renders at or above 768px
- **THEN** each goal row shows a drag handle usable to reposition that goal directly, with no separate reorder mode or trigger required

#### Scenario: Mobile unit drag surface

- **WHEN** reprioritization opens below 768px
- **THEN** there is no dedicated unit-drag Sheet — the reorder mode described below collapses cards in place and each collapsed card, not a unit block, has its own clearly labeled, touch-sized drag handle, and the full list remains scrollable

#### Scenario: Mobile reorder mode replaces the unit-drag Sheet

- **WHEN** the user activates reordering below 768px
- **THEN** the reorder mode described below opens in place, not a full-height Sheet containing unit drag handles

### Requirement: Goals are reordered individually via inline drag

On a viewport at or above 768px, every in-flight goal row on the project detail route SHALL show a drag handle. Dragging a row directly changes its position in the project's flat priority order. Each completed drag SHALL commit immediately — there SHALL be no separate save step and no confirmation dialog. A goal MAY be dragged to any position, including ahead of a goal it `DependsOn` that has not yet been reached; that goal's blocked/restricted state is unaffected by its position.

#### Scenario: Dragging a goal commits immediately

- **GIVEN** a project detail route with at least two in-flight goals
- **WHEN** the user drags one goal row to a new position and releases it
- **THEN** the new priority order is saved without any further confirmation step

#### Scenario: A goal can be moved ahead of its own unreached prerequisite

- **GIVEN** a Rank goal that `DependsOn` an unreached Ascension goal for the same unit
- **WHEN** the user drags the Rank goal above the Ascension goal
- **THEN** the drag succeeds, and the Rank goal's Restricted indicator (from `goal-blocker-reasons`) remains present, unaffected by the new position

### Requirement: Mobile reordering uses a dedicated reorder mode

Below 768px, the project detail route SHALL offer a button that toggles a reorder mode. Activating it SHALL collapse every goal card to its minimal identifying information (at least the unit's name/avatar and the goal's from → to representation) and make each card directly draggable in place. There SHALL be no separate dialog, Sheet, or Save action — each completed drag SHALL commit immediately, the same as the desktop drag handle. Deactivating the reorder mode (via the same button, or navigating away) SHALL restore cards to their full, non-reorderable presentation.

#### Scenario: Entering reorder mode collapses cards

- **GIVEN** a project detail route below 768px with at least two in-flight goals
- **WHEN** the user activates the reorder button
- **THEN** every visible goal card collapses to its minimal information and becomes draggable

#### Scenario: A drag in reorder mode commits without a Save step

- **GIVEN** reorder mode is active
- **WHEN** the user drags one collapsed card to a new position
- **THEN** the new order is saved immediately, with no Save button and no confirmation step

#### Scenario: Exiting reorder mode restores full cards

- **GIVEN** reorder mode is active
- **WHEN** the user deactivates it
- **THEN** every card returns to its full, non-reorderable presentation

### Requirement: Goal order drives priority-sensitive calculations

The ordered project-goal list consumed by Dailies, Raids Plan, Insights, and farming estimates SHALL be the same flat, per-goal priority order shown by project detail. No consumer SHALL independently sort it into a different execution order.

#### Scenario: Shared inventory follows goal order across units

- **GIVEN** two goals for different units need the same resource and available inventory covers only the first goal in priority order
- **WHEN** the plan is calculated
- **THEN** inventory is applied to the higher-priority goal first, regardless of which unit it belongs to

### Requirement: The detail route assembles membership in bulk

The detail route SHALL provide an action that adds existing goals to the viewed project without visiting each goal individually. The surface it opens SHALL list the profile's goals, SHALL let the user search them, SHALL show for every listed goal whether it already belongs to the viewed project, and SHALL apply every selection in a single save. Goals already belonging to the project SHALL remain members when the selection is saved.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user is on a project's detail route
- **WHEN** they open the add-goals surface, select three goals, and save
- **THEN** all three belong to the project and no other membership of that project is lost

#### Scenario: Existing membership is visible while assembling

- **GIVEN** the project already contains some of the listed goals
- **WHEN** the add-goals surface renders
- **THEN** each listed goal shows whether it is already a member of the viewed project

#### Scenario: Search narrows the assembly list

- **WHEN** the user enters text in the add-goals surface
- **THEN** the listed goals narrow to those matching it

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** the project's membership changed elsewhere after the surface was opened
- **WHEN** the user saves a selection
- **THEN** the goals added elsewhere remain members of the project

#### Scenario: Assembly does not remove members

- **WHEN** the user saves a selection from the add-goals surface
- **THEN** no goal is removed from the project as a result of that save

#### Scenario: Added goals do not reorder existing units

- **GIVEN** a project whose units are in an established priority order
- **WHEN** goals for a new unit are added and saved
- **THEN** the existing units keep their relative order and the added unit is placed last

### Requirement: Assembly blocks a selection whose goal-type slot is occupied

A project holds at most one Active/Paused goal per `(entityType, entityId, goalType)`, and a save that would place two such goals in one project is rejected in full rather than in part. The assembly surface SHALL therefore identify a listed goal whose slot is already held by an Active/Paused member of the viewed project, SHALL prevent it from being selected, and SHALL state the reason. A save SHALL NOT be submitted in a state that would be rejected for this reason.

#### Scenario: Conflicting goal cannot be selected

- **GIVEN** the viewed project contains an Active goal for a unit and goal type
- **WHEN** the add-goals surface lists another Active goal for the same unit and goal type
- **THEN** that goal cannot be selected and the reason is stated

#### Scenario: A conflict arising after the check rejects the whole save

- **GIVEN** the user has selected several goals and one of them becomes conflicting after the surface checked it
- **WHEN** they save
- **THEN** nothing is added, the conflict is explained, and the selection remains available to correct rather than being discarded

#### Scenario: Historical goal in the project does not block selection

- **GIVEN** the viewed project contains only a Completed or Archived goal for that unit and goal type
- **WHEN** the add-goals surface lists another goal for the same unit and goal type
- **THEN** it can be selected and saved

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

### Requirement: Project detail groups by the selected dimension

Project detail SHALL render its goals grouped by the dimension selected in its Group control. The control SHALL offer no grouping, grouping by unit, and grouping by goal type. When grouping by unit or by goal type, each group SHALL carry a heading identifying it; when grouping is off, the goals SHALL render as one list with no heading. Grouping SHALL apply to whichever goals the current status filter shows, and SHALL NOT alter stored goal priority.

#### Scenario: A project opens grouped by goal type

- **GIVEN** a project containing goals of several types
- **WHEN** its detail route is first opened
- **THEN** the goals are grouped by goal type, each group labelled with its type

#### Scenario: Several goals share one unit block

- **GIVEN** Ragnar has Rank, Ability, and Ascension goals in the project
- **WHEN** the user selects Group by unit
- **THEN** one Ragnar block contains all three goals, labelled with the unit's name

#### Scenario: Grouping can be turned off

- **WHEN** the user selects no grouping
- **THEN** the project's goals render as a single ungrouped list with no group heading

#### Scenario: Grouping applies to archived goals too

- **GIVEN** the Archived status filter is selected
- **WHEN** a grouping dimension is selected
- **THEN** the archived goals are grouped by that dimension rather than rendered flat

#### Scenario: Grouping leaves priority untouched

- **GIVEN** a project whose goals are in an established priority order
- **WHEN** the user changes the Group selection
- **THEN** the visible presentation changes and the stored goal order does not

### Requirement: Sort orders individual goals; Group=Unit is a display-only clustering

When project detail is grouped by unit, the goals within each unit's visual cluster SHALL render in their existing flat priority order (not a separately computed order), and the Sort selection SHALL determine the order of the clusters themselves. Under every other grouping dimension, Sort SHALL order the goals directly, as it does elsewhere. Group=Unit and Sort SHALL NOT alter the stored per-goal priority order — they are rendering choices over it.

#### Scenario: A unit's goals keep their priority order inside its cluster

- **GIVEN** a project grouped by unit, where one unit has two goals whose flat priority order is A then B
- **WHEN** that unit's cluster renders
- **THEN** goal A renders above goal B inside the cluster, regardless of the Sort selection

#### Scenario: Drag is confined to a goal's own cluster while grouped by unit

- **GIVEN** a project grouped by unit, with clusters for units X and Y
- **WHEN** the user drags a goal belonging to unit X
- **THEN** the drag only reorders that goal among the other goals already in unit X's cluster — there is no drop target outside unit X's cluster, so the drag cannot move the goal into unit Y's cluster or to a flat-order position between unit Y's goals; a true cross-unit reorder requires switching to no grouping or Group by type first

#### Scenario: Sort reorders the clusters themselves

- **GIVEN** a project grouped by unit
- **WHEN** the user changes the Sort selection
- **THEN** the order of the unit clusters changes accordingly, without changing any goal's stored priority

#### Scenario: Sort applies normally without unit grouping

- **GIVEN** a project grouped by goal type or not grouped
- **WHEN** the user changes the Sort selection
- **THEN** the goals are ordered by that selection

### Requirement: Historical goals stay outside the in-flight ordering

Completed and Archived goals SHALL remain discoverable through the status filter, and SHALL NOT take part in the ordering that expresses the project's in-flight goal priority.

#### Scenario: Same unit has historical goals

- **GIVEN** a unit has Completed or Archived goals as well as in-flight ones
- **WHEN** the user selects the corresponding status filter
- **THEN** those goals are shown without taking a position in the project's in-flight goal priority ordering

### Requirement: The detail route's browsing controls persist across projects

The status, Type, Sort, and Group selections SHALL persist when the user switches to another project through the detail route's project switcher, so that a chosen way of reading a project carries across projects. Goal type SHALL be the Group selection when the detail route is first opened.

#### Scenario: Group selection carries to the next project

- **GIVEN** the user is viewing project A grouped by unit
- **WHEN** they switch to project B through the project switcher
- **THEN** project B is also shown grouped by unit

#### Scenario: Goal type is the initial grouping

- **GIVEN** the user has not changed the Group selection in this session
- **WHEN** they open a project's detail route
- **THEN** its goals are grouped by goal type

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
