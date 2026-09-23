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

The detail route SHALL offer status and Group controls but no Type or Sort control. It SHALL show all member goals of the selected status in their canonical global relative order, subject to grouping. Group SHALL not change priority. The detail route SHALL not offer project-local reordering; it SHALL link to Global Plan for prioritization.

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

At or above 768px, project cards SHALL use a comparison-friendly grid. Below 768px, cards and headers SHALL stack and primary actions SHALL remain labeled and touch-sized. Project detail SHALL show an accessible link to Global Plan for reordering at both breakpoints instead of local drag controls.

#### Scenario: Desktop drag handle

- **WHEN** project detail renders at or above 768px
- **THEN** no project-local drag handle appears and Global Plan is reachable for prioritization

#### Scenario: Mobile unit drag surface

- **WHEN** project detail renders below 768px
- **THEN** no project-local unit drag Sheet appears and Global Plan is reachable

#### Scenario: Mobile reorder mode replaces the unit-drag Sheet

- **WHEN** a mobile user wants to reorder from project detail
- **THEN** the route directs them to Global Plan's in-place reorder mode rather than opening a project-local Sheet

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

## REMOVED Requirements

### Requirement: Goals are reordered individually via inline drag

**Reason**: Project-local drag would imply an independent order that no longer exists.
**Migration**: Reorder each goal from Global Plan's desktop drag surface.

### Requirement: Mobile reordering uses a dedicated reorder mode

**Reason**: The project-local mobile reorder mode is replaced by a global one.
**Migration**: Use Global Plan's mobile reorder mode; project detail remains a read-only projection.
