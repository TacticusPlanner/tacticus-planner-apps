## MODIFIED Requirements

### Requirement: Placeholder tabs show Under Construction

Every primary tab other than Raids, Shops, Arena, Salvage Run, and Onslaught
SHALL render the shared "Under Construction" placeholder rather than an error, a
blank page, or partial functionality. The Shops tab SHALL render the Shops page
(daily shop recommendations for the selected project), the Arena tab SHALL
render the Arena recommendations page, the Salvage Run tab SHALL render the
Salvage Run recommendations page, and the Onslaught tab SHALL render the
Onslaught recommendations page, rather than the placeholder.

#### Scenario: Opening a non-Raids tab

- **WHEN** the user opens Guild Raids
- **THEN** the shared Under Construction placeholder is shown for that tab

#### Scenario: Opening Shops

- **WHEN** the user opens the Shops tab
- **THEN** the Shops recommendations page is shown rather than the Under
  Construction placeholder

#### Scenario: Opening Arena

- **WHEN** the user opens the Arena tab
- **THEN** the Arena recommendations page is shown rather than the Under
  Construction placeholder

#### Scenario: Opening Salvage Run

- **WHEN** the user opens the Salvage Run tab
- **THEN** the Salvage Run recommendations page is shown rather than the Under
  Construction placeholder

#### Scenario: Opening Onslaught

- **WHEN** the user opens the Onslaught tab
- **THEN** the Onslaught recommendations page is shown rather than the Under
  Construction placeholder
