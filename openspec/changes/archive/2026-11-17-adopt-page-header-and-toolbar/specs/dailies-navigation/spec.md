## RENAMED Requirements

- FROM: `### Requirement: Today's project selector, Raids Filters and Planning Settings share one row`
- TO: `### Requirement: Today's controls use the page header and toolbar`

## MODIFIED Requirements

### Requirement: Today's controls use the page header and toolbar

On the Today page, Planning Settings SHALL be the page header's Settings button (see `planning-settings-access`). Above the schedule, Today SHALL show the page toolbar (`app-page-layout`): the Find slot holds the project selector and then the Raids Filters action (see `daily-raids-filters`); the View slot holds Group by (see `daily-raids-today`). Below the 768px mobile breakpoint the project selector SHALL render as an icon-only trigger retaining an accessible name for the full label; at or above 768px it SHALL show its label.

#### Scenario: Desktop toolbar

- **WHEN** the user opens `/dailies/raids` at or above 768px
- **THEN** the project selector and the Filters action lead the toolbar row, Group by sits at its right end, and the Settings button sits at the right end of the page header

#### Scenario: Mobile toolbar

- **WHEN** the user opens `/dailies/raids` below 768px
- **THEN** the project selector renders its icon only, without a visible text label, while remaining identifiable via its accessible name, the Filters action follows it, Group by is behind the toolbar's View button, and the header shows the Settings icon button
