## MODIFIED Requirements

### Requirement: Filter persistence and scope

The applied filter SHALL persist per browser and survive reload, SHALL be shared by every consumer (Today, the HSE tab and the Home raids widget), SHALL apply regardless of project selection, SHALL NOT be imported from V1 saves, and SHALL degrade to an empty filter when storage is unavailable or holds invalid data. Stored ids no longer present in the catalog SHALL be ignored when matching and dropped on the next apply.

#### Scenario: Shared with the HSE tab

- **WHEN** a filter is applied on Today and the user opens the HSE tab
- **THEN** the HSE tab applies the same filter

#### Scenario: Shared with the Home widget

- **WHEN** a filter is applied on Today and the user opens Home
- **THEN** the Home raids widget shows the same filtered raids

#### Scenario: Stored filter from before Enemy traits existed

- **GIVEN** a stored filter value that has no enemy-traits field
- **THEN** it parses, every other stored group is kept, and no trait filter is set

#### Scenario: Corrupt storage

- **GIVEN** stored filter data that fails validation
- **THEN** the app behaves as if no filter were set and does not error
