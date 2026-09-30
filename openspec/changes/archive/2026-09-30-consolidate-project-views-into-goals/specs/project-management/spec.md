## ADDED Requirements

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

## MODIFIED Requirements

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

No surface SHALL provide a control that pauses or resumes every goal in a project at once — not the Projects page, its row menus, nor the Goals page scoped to a project. Pausing or resuming a goal SHALL remain available only per-goal, from that goal's own row actions.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens the Projects page, any project row's overflow menu, or the Goals page scoped to a project
- **THEN** no "Pause all" or "Resume all" control is rendered

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

## REMOVED Requirements

### Requirement: A project row navigates to its detail route

**Reason**: The detail route no longer exists.
**Migration**: See "A project row opens that project on Goals" above.

### Requirement: The detail route's project selector switches which project's detail route is shown

**Reason**: The detail route and its switcher no longer exist.
**Migration**: The Goals page's project scope chips (`goals-navigation`, "Goals project scope chip row") switch between projects in place.

### Requirement: Project detail shows every type in a fixed priority order

**Reason**: The detail route no longer exists; the Goals page already lists in canonical global order with no Sort control and offers reordering as a move within the visible projection.
**Migration**: `goals-navigation` "The Goals page is the single goals list and plan" and `global-goal-priority` "Owner can reorder from Goals" (filtered-list scenarios).

### Requirement: Goals are reordered individually via inline drag

**Reason**: Stated for the detail route only; the same semantics already hold on the Goals page under any filter.
**Migration**: `global-goal-priority` "Owner can reorder from Goals" ("Filtered plan", "Project-level reorder appears in the plan", dependency-preservation) and "Reorder conflicts are recoverable" (stale order).

### Requirement: Mobile reordering uses a dedicated reorder mode

**Reason**: Stated for the detail route only.
**Migration**: `global-goal-priority` "Owner can reorder from Goals" (mobile reorder mode scenarios) applies to the Goals page whether or not it is scoped.

### Requirement: The detail route assembles membership in bulk

**Reason**: Relaunched from the Projects row menu.
**Migration**: See "Manage goals assembles membership in bulk" above; the surface itself is unchanged.

### Requirement: Project detail groups goals by the selected dimension

**Reason**: The detail route no longer exists; the Goals page's own Group control (none, type, unit) applies to a scoped list too.
**Migration**: `goals-navigation` "Switching project scope preserves list controls".

### Requirement: The detail route's browsing controls persist across projects

**Reason**: There is one page now; switching scope never remounts the controls.
**Migration**: `goals-navigation` "Switching project scope preserves list controls". The detail-only "goal type on first visit" default is dropped; Goals keeps its single persisted Group selection.

### Requirement: Project detail presents its goals as a selection of the account's goals

**Reason**: The header card carrying the "N of M goals" summary is removed with the route; the scope chips show each project's goal count next to "All goals".
**Migration**: `goals-navigation` "Goals project scope chip row" (counts) and "Scoped Goals adjusts contextual actions and copy" (empty project state).

### Requirement: The detail route offers a Create Goal action alongside Add Goals

**Reason**: The detail route no longer exists.
**Migration**: "The Projects row menu hosts every project-specific action" above and `goal-creation-entry-points`.

### Requirement: Project detail links to Goals

**Reason**: The project view is the Goals page.
**Migration**: None needed.

### Requirement: Projects has list and detail routes under /plan/projects

**Reason**: Only the list route remains.
**Migration**: See "A project is viewed on the Goals page scoped to that project" above for the redirect.

### Requirement: The detail route header replaces the list row

**Reason**: The detail route no longer exists. Its metrics line, farming-guidance preview line, and switcher are not relocated.
**Migration**: Project outlook remains on the Projects row (`plan-completion-outlook`) and Insights.

### Requirement: The project order note explains account-wide numbers

**Reason**: Moved to the Goals page's scoped order explanation.
**Migration**: `goals-navigation` "Goals explains its priority order compactly".

### Requirement: Project management is deliberately responsive

**Reason**: Its scenarios were about the project detail route's drag handle and reorder mode, which no longer exist there.
**Migration**: "The Projects page is responsive" above for the dashboard; `global-goal-priority` "Owner can reorder from Goals" for drag/reorder on the (scoped) Goals page.
