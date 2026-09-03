## MODIFIED Requirements

### Requirement: Placeholder tabs show Under Construction

Every primary tab other than Raids and Shops SHALL render the shared "Under Construction" placeholder
rather than an error, a blank page, or partial functionality. The Shops tab SHALL render the Shops
page (daily shop recommendations for the selected project), not the placeholder.

#### Scenario: Opening a non-Raids tab

- **WHEN** the user opens Onslaught, Salvage Run, Arena, or Guild Raids
- **THEN** the shared Under Construction placeholder is shown for that tab

#### Scenario: Opening Shops

- **WHEN** the user opens the Shops tab
- **THEN** the Shops recommendations page is shown rather than the Under Construction placeholder
