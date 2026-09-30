# project-management Specification

## Purpose

Makes Projects a list/detail pair of routes: `/goals/projects` for browsing, creating, and managing projects, and `/goals/projects/{id}` for one project's own row plus its goal table — separating "manage a project" from "choose which project's goals to view" into two distinct routes instead of two controls competing for the same page.

## Requirements

### Requirement: Creating and editing a project uses a form Sheet

The list route SHALL provide a "New project" affordance and, on each project row, an "Edit" action. Both SHALL open the same form (name, description, color) in a Sheet — "New project" with empty fields, "Edit" pre-filled with that row's project. Submitting the form SHALL save the change and close the Sheet without navigating away from the current route. The Projects page SHALL be the only surface offering New project.

#### Scenario: Creating a project

- **WHEN** the user activates "New project", fills in a name in the opened Sheet, and submits
- **THEN** the new project appears as a row in the list and the Sheet closes

#### Scenario: Editing a project

- **WHEN** the user activates "Edit" on a project row, changes its name in the opened Sheet, and submits
- **THEN** the project row reflects the new name and the Sheet closes

#### Scenario: Goals offers no project creation

- **WHEN** the user opens the Goals page at either breakpoint
- **THEN** no New project or Create project action is rendered there

### Requirement: No bulk pause/resume on Projects

No surface SHALL provide a control that pauses or resumes every goal in a project at once by virtue of its membership — not the Projects page, its row menus, nor the Goals page scoped to a project. Pausing or resuming SHALL be available only per goal from that goal's own row menu, or over an explicit selection of goals the user has checked (`goal-bulk-actions`); a project scope on the Goals page narrows what can be selected but never acts on the project as a whole.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens the Projects page, any project row's overflow menu, or the Goals page scoped to a project
- **THEN** no "Pause all" or "Resume all" control is rendered

#### Scenario: Selection-based bulk pause is allowed inside a scope

- **GIVEN** the Goals page is scoped to project B and the user has selected three of its goals
- **WHEN** the user activates the bulk Pause action
- **THEN** exactly those three goals are paused, and the project's other goals are untouched

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

### Requirement: Goal order drives priority-sensitive calculations

The project-goal list SHALL be a filtered projection of the canonical global order. Dailies, Raids Plan, Insights, and farming estimates SHALL run over all Active goals globally once; project views SHALL show filtered results from that run without independently sorting or reallocating resources.

#### Scenario: Shared inventory follows goal order across units

- **GIVEN** two Active goals in different projects need the same resource and owned inventory covers only the globally higher-priority goal
- **WHEN** planning is calculated
- **THEN** that goal receives the inventory first regardless of unit or project

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

Wherever a goal row renders with project memberships, its actions SHALL offer removing that goal from a project in addition to deleting it. When the Goals page is scoped to a project, removal from that project SHALL take effect on that project only, the row SHALL leave the scoped list, and the outcome SHALL be reported naming the goal and, when the goal was relocated, its destination project.

#### Scenario: A goal row offers both actions

- **WHEN** a goal row's actions are examined on the Goals page scoped to a project
- **THEN** both a project-removal action and an account-wide delete action are offered

#### Scenario: Removed goal leaves the viewed list

- **GIVEN** a goal is listed on the Goals page scoped to project A
- **WHEN** it is removed from project A
- **THEN** it no longer appears in the scoped list and the outcome is reported

#### Scenario: Relocation destination is reported

- **GIVEN** the removed goal's only membership was project A
- **WHEN** the removal completes
- **THEN** the reported outcome names the project the goal was relocated to

### Requirement: Historical goals stay outside the in-flight ordering

Completed and Archived goals SHALL remain discoverable through the status filter, and SHALL NOT take part in the ordering that expresses the project's in-flight goal priority.

#### Scenario: Same unit has historical goals

- **GIVEN** a unit has Completed or Archived goals as well as in-flight ones
- **WHEN** the user selects the corresponding status filter
- **THEN** those goals are shown without taking a position in the project's in-flight goal priority ordering

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

### Requirement: A project is viewed on the Goals page scoped to that project

The system SHALL NOT present a per-project goal detail route. A project's goals SHALL be viewed on the Goals page (`/plan/goals`) with that project selected in its project scope (see `goals-navigation`, "Goals project scope is URL state"). `/plan/projects/{id}` SHALL NOT be a route; it falls through to the app's existing not-found handling. Wherever another spec says "project detail route", "Project Detail", "a project's page", or "the detail route", it means the Goals page scoped to that project.

#### Scenario: A project opens on Goals

- **WHEN** the user activates a project anywhere it is listed (Projects page row, home page card)
- **THEN** the Goals page opens at `/plan/goals?project={id}` scoped to that project

#### Scenario: The former detail path is not a route

- **WHEN** the user opens `/plan/projects/{id}`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

### Requirement: The Projects row menu hosts every project-specific action

Each non-archived project row's overflow menu on `/plan/projects` SHALL offer, in order: **Create goal**, **Manage goals**, **Edit**, then **Archive**. An archived project row's menu SHALL offer **Edit** and **Restore** only. Create goal SHALL open goal creation with that row's project preselected (see `goal-creation-entry-points`). Manage goals SHALL open the bulk membership surface for that row's project. Activating Create goal or Manage goals SHALL NOT navigate away from the Projects page. Archive SHALL remain unavailable, with explanatory text, for the Default project.

#### Scenario: A live project's menu lists the four actions

- **WHEN** the user opens the overflow menu of a non-archived project row
- **THEN** Create goal, Manage goals, Edit, and Archive appear, in that order, with text labels

#### Scenario: Manage goals opens for that row's project

- **GIVEN** two projects A and B are listed
- **WHEN** the user chooses Manage goals on project B's row
- **THEN** the bulk membership surface opens for project B, the URL stays `/plan/projects`, and closing it returns to the unchanged list

#### Scenario: Create goal preselects that row's project

- **WHEN** the user chooses Create goal on a non-default project's row
- **THEN** the goal-creation sheet opens with that project preselected as the goal's membership, and the URL stays `/plan/projects`

#### Scenario: An archived project's menu is lifecycle-only

- **WHEN** the user opens the overflow menu of an archived project row
- **THEN** Edit and Restore appear, and neither Create goal nor Manage goals is offered

### Requirement: A project row opens that project on Goals

Activating a project card outside its controls SHALL navigate to `/plan/goals?project={id}` for that project. Card controls SHALL NOT navigate.

#### Scenario: Card opens the scoped Goals page

- **WHEN** the user activates a project card outside its controls
- **THEN** the app navigates to `/plan/goals?project={id}` and the Goals page renders with that project's chip selected

#### Scenario: Card action does not navigate

- **WHEN** the user invokes an overflow action
- **THEN** that action runs without also opening the card

### Requirement: Manage goals assembles membership in bulk

The Projects page SHALL provide, from each non-archived project row's overflow menu, a Manage goals action that edits memberships for multiple existing goals of that project without visiting each goal individually. The surface SHALL list the profile's goals in account-wide priority order (`Goal.GlobalPriority`), with search and grouping by unit or goal type; it SHALL NOT offer a separate sort. It SHALL distinguish current membership from pending additions and removals and SHALL show a review summary before one explicit save. The save SHALL apply the complete reviewed set atomically. A stale-set, occupied-slot, or last-membership rejection SHALL identify the problem, preserve the draft, and allow the user to refresh/reconcile before retrying. Membership changes SHALL NOT change goal status, target, or canonical global priority.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user opened Manage goals from a project's row
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
- **THEN** the canonical order and relative position of every goal remain unchanged, and a newly added goal appears in the scoped Goals view at its existing global position

#### Scenario: Several removals and additions in one save

- **WHEN** the user marks two current members for removal, three goals for addition, reviews the summary, and saves
- **THEN** all five membership changes commit together or none commits if any validation fails

#### Scenario: Removing the only membership is blocked

- **WHEN** a pending removal would leave a goal in no project
- **THEN** the save is rejected without applying other changes and the affected goal is identified with guidance to add it to another project first (the Default project is always available)

#### Scenario: Pending selection survives navigation within the list

- **WHEN** the user filters, groups, or scrolls the list after making selections
- **THEN** the review summary and eventual saved set retain those selections

### Requirement: The Projects page is responsive

At or above 768px, project cards SHALL use a comparison-friendly grid. Below 768px, cards SHALL stack and primary actions SHALL remain labeled and touch-sized.

#### Scenario: Desktop grid

- **WHEN** the Projects page renders at or above 768px
- **THEN** project cards render in a grid that allows comparing projects side by side

#### Scenario: Mobile stack

- **WHEN** the Projects page renders below 768px
- **THEN** project cards stack vertically and the New project action and each row's overflow trigger remain labeled (visibly or accessibly) and touch-sized
