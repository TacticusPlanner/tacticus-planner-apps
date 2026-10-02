## ADDED Requirements

### Requirement: Today requires a populated Onslaught rewards dataset and tolerates a missing reward row

Today SHALL treat the catalog's Onslaught rewards dataset as loaded only when it contains at least one row; an empty dataset (for example during a first sync or a sync that has not reached that dataset yet) SHALL keep Today in its loading state, consistent with how Today already gates rendering on its other required data sources. Once loaded, a reward row missing for a specific sector and tier SHALL NOT prevent Today from rendering: the affected goal's Onslaught contribution SHALL be treated as zero and the rest of the schedule SHALL render.

#### Scenario: Empty rewards dataset keeps Today loading

- **GIVEN** the catalog's Onslaught rewards dataset is present but contains no rows
- **WHEN** Today would otherwise render
- **THEN** Today defers rendering until the dataset has rows

#### Scenario: Missing row for the player's sector and tier

- **GIVEN** the Onslaught rewards dataset has rows but none for the sector and tier of a goal's alliance progress
- **WHEN** Today renders
- **THEN** Today renders its schedule with that goal contributing no Onslaught shards, and no error is raised to the user
