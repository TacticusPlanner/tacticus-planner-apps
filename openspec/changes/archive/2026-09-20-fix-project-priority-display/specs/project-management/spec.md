## REMOVED Requirements

### Requirement: The detail route shares Overview's goal filters

**Reason**: Project detail's Type filter and Sort control are removed entirely — every goal type is always shown, and the project's goals are always ordered by stored priority with no other ordering ever selectable. Replaced by "Project detail always shows every type in a fixed priority order" under ADDED Requirements below, which keeps the status filter and Group control this requirement also covered.

**Migration**: A caller or test that selected a Type filter or a Sort value on project detail has nothing to migrate to — those controls no longer exist there. Goals Overview is unaffected; its own Type and Sort controls are unchanged.

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

### Requirement: Sort orders individual goals; Group=Unit is a display-only clustering

**Reason**: Project detail no longer has a Sort control to order goals or reorder clusters — priority is now the route's one fixed order, always in effect, not one option a Sort control selects among several. Replaced by "Group=Unit clusters the fixed priority order, it doesn't reorder it" under ADDED Requirements below.

**Migration**: A caller or test that changed Sort to reorder clusters, or to order ungrouped goals, has nothing to migrate to — that control no longer exists on project detail. The underlying guarantee (a unit's own goals keep their relative order inside its cluster; drag stays confined to one cluster while grouped by unit) still holds, now unconditionally.

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

## ADDED Requirements

### Requirement: Project detail always shows every type in a fixed priority order

The detail route SHALL offer the status filter and the Group control for normal browsing; it SHALL NOT offer a Type filter or a Sort control. Every in-flight and historical goal in the project is shown regardless of type, subject only to the status filter, and the project's goals are always ordered by their real stored per-goal priority — the one order the drag handles and mobile reorder mode actually manipulate, with no other ordering ever available to obscure it. The Group control SHALL NOT affect stored goal priority. Reordering SHALL occur only via drag — the inline per-row handle at or above 768px, or the dedicated mobile reorder mode below it — never as a side effect of Group.

#### Scenario: No Type filter is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Type filter control is rendered, and goals of every type are shown (subject only to the status filter and Group)

#### Scenario: No Sort control is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Sort control is rendered — the goal list is always ordered by stored priority, with no way to change that ordering from this route

#### Scenario: Group by unit groups the current project's goals

- **WHEN** the user selects Group by unit on a project's detail route
- **THEN** that project's goals are grouped by unit without altering stored goal priority

### Requirement: Group=Unit clusters the fixed priority order, it doesn't reorder it

Project detail's goals are always ordered by stored priority; grouping (None, by unit, or by goal type) is purely a rendering choice layered over that fixed order, never a separately computed order and never a way to change it. When grouped by unit, the goals within each unit's visual cluster SHALL render in their existing priority order, and the clusters themselves SHALL appear in the order their first (lowest-priority) member would appear in the ungrouped list. Grouping SHALL NOT alter the stored per-goal priority order.

#### Scenario: A unit's goals keep their priority order inside its cluster

- **GIVEN** a project grouped by unit, where one unit has two goals whose priority order is A then B
- **WHEN** that unit's cluster renders
- **THEN** goal A renders above goal B inside the cluster

#### Scenario: Drag is confined to a goal's own cluster while grouped by unit

- **GIVEN** a project grouped by unit, with clusters for units X and Y
- **WHEN** the user drags a goal belonging to unit X
- **THEN** the drag only reorders that goal among the other goals already in unit X's cluster — there is no drop target outside unit X's cluster, so the drag cannot move the goal into unit Y's cluster or to a position between unit Y's goals; a true cross-unit reorder requires switching to no grouping or Group by type first

#### Scenario: Cluster order follows priority order

- **GIVEN** a project grouped by unit, where unit X's highest-priority goal outranks (has a lower priority number than) any of unit Y's goals
- **WHEN** the clusters render
- **THEN** unit X's cluster appears before unit Y's cluster

#### Scenario: Priority order applies directly without unit grouping

- **GIVEN** a project grouped by goal type or not grouped
- **WHEN** its goals render
- **THEN** they appear in stored priority order

## MODIFIED Requirements

### Requirement: The detail route's browsing controls persist across projects

The status and Group selections SHALL persist when the user switches to another project through the detail route's project switcher, so that a chosen way of reading a project carries across projects. Goal type SHALL be the Group selection the first time the detail route is opened in a browser, and persists across page reloads after that (not only within the current session).

#### Scenario: Group selection carries to the next project

- **GIVEN** the user is viewing project A grouped by unit
- **WHEN** they switch to project B through the project switcher
- **THEN** project B is also shown grouped by unit

#### Scenario: Goal type is the initial grouping

- **GIVEN** the user has never changed the Group selection in this browser
- **WHEN** they open a project's detail route
- **THEN** its goals are grouped by goal type
