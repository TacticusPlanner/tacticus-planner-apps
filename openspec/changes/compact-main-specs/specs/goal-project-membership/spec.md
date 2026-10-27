## MODIFIED Requirements

### Requirement: The scoped Goals page's row menu hosts project removal

When the Goals page is scoped to a project, each goal row's "⋯" menu, on desktop and mobile alike, SHALL offer that project's removal action between Pause/Resume and Delete: "Remove from this project" when the goal belongs to another project as well, and "Move to project" when the scoped project is its only one (see "The goal row's project-removal action offers a chosen destination when relocation is needed"). The goal's memberships are known from the goals list itself; the item SHALL be disabled only while the account's projects are not loaded.

#### Scenario: Scoped row menu offers removal

- **GIVEN** the Goals page is scoped to project A and a goal belongs to A and B
- **WHEN** its row menu is opened
- **THEN** it lists Edit, Pause, Remove from this project and Delete, in that order

#### Scenario: Removal happens without a picker

- **GIVEN** the Goals page is scoped to project A and a goal belongs to A and B
- **WHEN** the user picks Remove from this project
- **THEN** the goal leaves A, stays in B, leaves the scoped list, and a toast names the goal and A

#### Scenario: Last project asks for a destination

- **GIVEN** the Goals page is scoped to project A, a goal's only project is A, and project B exists
- **WHEN** the user picks Move to project and chooses B
- **THEN** the goal belongs to B and no longer to A, and a toast names the goal and B

#### Scenario: Partly loaded memberships keep removal disabled

- **GIVEN** the Goals page is scoped to project A, the goals have loaded and the project list is still loading
- **WHEN** a goal's row menu is opened
- **THEN** the project-removal item is disabled until the project list loads, and is then enabled at once; no member-list request is ever issued

#### Scenario: Unscoped menu has no removal

- **WHEN** a row menu is opened on the Goals page without a project scope
- **THEN** it offers no project-removal item

#### Scenario: Delete confirmation names the alternative while scoped

- **GIVEN** the Goals page is scoped to project A
- **WHEN** a row's delete confirmation opens
- **THEN** it says the deletion is account-wide and names removal from A as the alternative

### Requirement: The goal row's project-removal action offers a chosen destination when relocation is needed

When a goal's viewed project is its only membership, the row's project-removal action ("Move to project") SHALL let the user choose the destination rather than relocating automatically: it SHALL list the account's other existing projects, and SHALL offer creating a new project as an additional option. Selecting an existing project SHALL move the goal there; the move is never rejected for an occupied slot (see "In-flight goal-type uniqueness is scoped to a project"). Choosing to create a new project SHALL open project creation; once the new project is saved, the goal SHALL move into it.

When the goal's viewed project is not its only membership, the row's project-removal action SHALL remain a plain removal with no destination to choose, leaving the goal a member of its other project(s).

This requirement governs the goal row's own project-removal action specifically. The goal's membership editor (its edit form's project chips) is a separate surface and keeps its own last-membership behavior — see "Every goal retains at least one project membership".

#### Scenario: Removal without a destination when other memberships exist

- **GIVEN** a goal belongs to projects A and B
- **WHEN** it is removed from A via its row action
- **THEN** it remains a member of B, and no destination picker is shown

#### Scenario: Moving to an existing project

- **GIVEN** a goal's only membership is project A, and the account also has project B
- **WHEN** the user opens the row's "Move to project" action and selects project B
- **THEN** the goal belongs to project B and no longer belongs to A

#### Scenario: Moving to a newly created project

- **GIVEN** a goal's only membership is project A
- **WHEN** the user opens "Move to project", chooses to create a new project, and saves it
- **THEN** the goal belongs to the newly created project and no longer belongs to A

## REMOVED Requirements

### Requirement: Goals can be filtered by project membership

**Reason**: D46 — describes the retired Goals Overview membership filter (its scenario uses an Archived status filter that no longer exists); project scope on Goals is owned by `goals-navigation`.

**Migration**: `goals-navigation` "Goals project scope is URL state", "Goals project scope chip row" and "Goals project filter is independent of the project selection".
