## MODIFIED Requirements

### Requirement: Project selector is trailing in its row

On any subpage that renders both a tab or status control and a project selector, the project selector SHALL be trailing (right-aligned) in the same row as that tab or status control. On a subpage with a project selector and no tab or status control (Insights, Schedule), the project selector SHALL be the first control of the page toolbar's Find slot (`app-page-layout`), with its text label at every width. No subpage is exempt.

#### Scenario: Project selector shares a row with tabs where both exist

- **WHEN** a subpage renders both a tab/status row and a project selector
- **THEN** the project selector appears trailing in that same row, not in a separate row

#### Scenario: Project selector sits in the toolbar when there is nothing to pair it with

- **WHEN** a subpage renders a project selector but no tab or status control (Goals Insights, Schedule)
- **THEN** the project selector is in the page toolbar's Find slot and shows its selected project's name, also below 768px
