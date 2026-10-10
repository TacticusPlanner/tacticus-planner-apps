## ADDED Requirements

### Requirement: The scoped Goals page's row menu hosts project removal

When the Goals page is scoped to a project, each goal row's "⋯" menu, on desktop and mobile alike, SHALL offer that project's removal action between Pause/Resume and Delete: "Remove from this project" when the goal belongs to another project as well, and "Move to project" when the scoped project is its only one (see "The goal row's project-removal action offers a chosen destination when relocation is needed"). The item SHALL be disabled while the account's projects or the goal's memberships are not loaded. Without a project scope the menu SHALL offer no project-removal item. While scoped, the row's delete confirmation SHALL name removal from the scoped project as the alternative.

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

#### Scenario: Unscoped menu has no removal

- **WHEN** a row menu is opened on the Goals page without a project scope
- **THEN** it offers no project-removal item

#### Scenario: Delete confirmation names the alternative while scoped

- **GIVEN** the Goals page is scoped to project A
- **WHEN** a row's delete confirmation opens
- **THEN** it says the deletion is account-wide and names removal from A as the alternative
