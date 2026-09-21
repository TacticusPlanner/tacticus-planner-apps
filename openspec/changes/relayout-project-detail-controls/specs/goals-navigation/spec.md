## MODIFIED Requirements

### Requirement: Project selector position

On any subpage that renders both a tab or status control and a project selector, the project selector SHALL be trailing (right-aligned) in the same row as that tab or status control. On a subpage with a project selector and no tab or status control, the project selector SHALL be right-aligned alone. The project detail route is an exception: it groups the project switcher together with its labeled status filter and Group control inside its header card, and within that grouped layout the project switcher is not required to be trailing.

#### Scenario: Project selector shares a row with tabs where both exist

- **WHEN** a subpage renders both a tab/status row and a project selector
- **THEN** the project selector appears trailing in that same row, not in a separate row

#### Scenario: Project selector stands alone when there is nothing to pair it with

- **WHEN** a subpage renders a project selector but no tab or status control (Goals Insights)
- **THEN** the project selector is right-aligned in its own row

#### Scenario: Project detail groups its browsing controls in the header instead

- **GIVEN** the user opens a project's detail route
- **WHEN** the header renders
- **THEN** the project switcher renders together with the labeled status filter and Group control inside the header card, and this project-detail-specific layout is not held to the "trailing in the same row" rule that governs every other subpage
