## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Project goals are grouped by unit

**Reason**: The requirement mandated unit blocks as project detail's presentation, which conflicts with the Group control the same capability requires the route to offer — a user selecting "none" or "type" cannot also be shown one block per unit. The conflict is why neither was implemented. Grouping is now a user-selected dimension defaulting to goal type.

**Migration**: Replaced by "Project detail groups by the selected dimension" below, which keeps one-block-per-unit and dependency-ordered goals within a block as the behavior of the unit dimension, and keeps historical goals out of the in-flight priority ordering. No stored data, priority, or API behavior changes — only which grouping the route renders by default. The two other requirements that described detail content as "unit-grouped" are modified above to say "grouped" for the same reason.

## ADDED Requirements

### Requirement: Project detail groups by the selected dimension

Project detail SHALL render its goals grouped by the dimension selected in its Group control. The control SHALL offer no grouping, grouping by unit, and grouping by goal type. When grouping by unit or by goal type, each group SHALL carry a heading identifying it; when grouping is off, the goals SHALL render as one list with no heading. Grouping SHALL apply to whichever goals the current status filter shows, and SHALL NOT alter stored unit priority.

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

- **GIVEN** a project whose units are in an established priority order
- **WHEN** the user changes the Group selection
- **THEN** the visible presentation changes and the stored unit order does not

### Requirement: Sort orders unit blocks rather than their contents

When project detail is grouped by unit, the Sort selection SHALL determine the order of the unit blocks, and the goals inside each block SHALL retain their automatic dependency-first order regardless of the Sort selection. Under every other grouping dimension, Sort SHALL order the goals as it does elsewhere.

#### Scenario: A prerequisite stays above its dependent goal

- **GIVEN** a unit whose Rank goal depends on its Ascension goal, and the Ascension goal was updated less recently
- **WHEN** the user groups by unit and sorts by most recently updated
- **THEN** the Ascension goal still renders above the Rank goal inside that unit's block

#### Scenario: Sort reorders the blocks themselves

- **GIVEN** a project grouped by unit
- **WHEN** the user changes the Sort selection
- **THEN** the order of the unit blocks changes accordingly

#### Scenario: Sort applies normally without unit grouping

- **GIVEN** a project grouped by goal type or not grouped
- **WHEN** the user changes the Sort selection
- **THEN** the goals are ordered by that selection

### Requirement: Historical goals stay outside the in-flight ordering

Completed and Archived goals SHALL remain discoverable through the status filter, and SHALL NOT take part in the ordering that expresses the project's in-flight unit priority.

#### Scenario: Same unit has historical goals

- **GIVEN** a unit has Completed or Archived goals as well as in-flight ones
- **WHEN** the user selects the corresponding status filter
- **THEN** those goals are shown without taking a position in the project's in-flight unit priority ordering

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
