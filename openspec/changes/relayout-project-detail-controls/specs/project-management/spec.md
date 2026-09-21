## ADDED Requirements

### Requirement: Project detail shows every type in a fixed priority order

The detail route SHALL offer the status filter and the Group control for normal browsing; it SHALL NOT offer a Type filter or a Sort control. Every in-flight and historical goal in the project is shown regardless of type, subject only to the status filter, and the project's goals are always ordered by their real stored per-goal priority — the one order the drag handles and mobile reorder mode actually manipulate, with no other ordering ever available to obscure it. The Group control SHALL NOT affect stored goal priority. Reordering SHALL occur only via drag — the inline per-row handle at or above 768px, or the dedicated mobile reorder mode below it — never as a side effect of Group.

#### Scenario: No Type filter is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Type filter control is rendered, and goals of every type are shown (subject only to the status filter and Group)

#### Scenario: No Sort control is offered

- **WHEN** the user opens a project's detail route
- **THEN** no Sort control is rendered — the goal list is always ordered by stored priority, with no way to change that ordering from this route

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

## MODIFIED Requirements

### Requirement: The detail route's current-project row matches the list route's row

The detail route SHALL replace the reused list row with a semantic project header containing back navigation, identity, description, Current plan state/action, summary metrics, overflow management actions, and the project's browsing controls — a labeled project switcher, a labeled status filter, and a labeled Group control. Grouped goal content SHALL render below the header, not the browsing controls.

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

#### Scenario: Browsing controls render inside the header

- **GIVEN** the user opens a project's detail route
- **WHEN** the header renders
- **THEN** the project switcher, status filter, and Group control render together inside the header card, each with a visible label reading "Project", "Filter", and "Group By" respectively, and only the grouped goal content renders below the header

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

## REMOVED Requirements

### Requirement: Project detail always shows every type in a fixed priority order

**Reason**: This requirement's scenario set included "Group by unit groups the current project's goals", which no longer applies now that the Group control stops offering "by unit" (see `relayout-project-detail-controls`). Re-added above under `ADDED Requirements` with that scenario dropped and everything else unchanged, since a `MODIFIED` block cannot drop a scenario.

**Migration**: No behavior other than the dropped scenario changes — the Type/Sort-control absence and fixed-priority ordering this requirement documents are unaffected.

### Requirement: Project detail groups by the selected dimension

**Reason**: This requirement's scenario set included "Several goals share one unit block" and offered "by unit" as a Group option, both removed by this change (see `relayout-project-detail-controls`). Re-added above under `ADDED Requirements` with the unit scenario dropped, a new "no unit option" scenario added, and everything else unchanged, since a `MODIFIED` block cannot drop a scenario.

**Migration**: Use grouping by goal type or no grouping instead. No requirement content changes beyond the option list and its scenario.

### Requirement: Group=Unit clusters the fixed priority order, it doesn't reorder it

**Reason**: Grouping by unit is no longer offered on the project detail route's Group control (see `relayout-project-detail-controls`) — there is nothing left for this requirement's cluster-ordering and cluster-confined-drag rules to govern.

**Migration**: Use grouping by goal type or no grouping instead. Stored per-goal priority order, and drag reordering against it, are unaffected either way — this requirement only ever described how unit grouping rendered that same fixed order, never a separate order of its own.
