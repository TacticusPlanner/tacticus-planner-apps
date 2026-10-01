## ADDED Requirements

### Requirement: Today lays out its groups side by side when there is room

On Dailies › Raids, the Today schedule, Bonus Raids and Today's Attempts SHALL each be their own group. Where the viewport leaves at least 20rem per group they SHALL sit side by side in one row, otherwise they SHALL stack in that order. The layout SHALL NOT depend on a dedicated breakpoint beyond the app's existing desktop/mobile split.

#### Scenario: Wide viewport

- **WHEN** the viewport can fit three 20rem groups
- **THEN** Today, Bonus Raids and Today's Attempts render as three columns in one row

#### Scenario: Mobile viewport

- **WHEN** the viewport is below the desktop breakpoint
- **THEN** the groups stack vertically in the order Today, Bonus Raids, Today's Attempts with no horizontal scroll

#### Scenario: No bonus entries

- **WHEN** there are no visible Bonus Raids entries
- **THEN** no Bonus Raids group is rendered and the remaining groups share the row
