## MODIFIED Requirements

### Requirement: A divider marks the season cut-off

With a mode on and Group set to None, the list SHALL render a divider immediately before the first eligible goal in display order (account-wide priority order) whose offset is 1 or more. The divider SHALL read "{season} ends {date}. The next goal finishes later." for Battle Pass and Guild Raid, and "{season} starts {date}. The next goal finishes after it." for Guild War, where {season} includes the season number when known.

- When every eligible goal has offset 0, or when no goal is eligible, there SHALL be no divider.
- With Group set to Type or Unit there SHALL be no divider, though labels and accents still show.
- The divider SHALL NOT be draggable or selectable and SHALL NOT change the priority order or the drag targets. During a drag it stays where it was, and it moves after the drop.

Where the divider renders depends on the view:

- In desktop Table view it SHALL be a full-width table row spanning every column.
- In desktop Cards view it SHALL span the full width of the grid. The goal after it starts a new grid row, and the cards before it keep their places in the rows above.
- Below 768px it SHALL be a list item between cards, and SHALL also appear in mobile reorder mode.

#### Scenario: Divider before the first spilling goal

- **GIVEN** mode Battle Pass, Group None, and Active goals in priority order A (This season), B (This season), C (Next season), D (This season)
- **WHEN** the list renders
- **THEN** a divider reading "Battle Pass season 42 ends Nov 15. The next goal finishes later." sits between B and C, and D keeps its "This season" label below it

#### Scenario: Project scope

- **GIVEN** mode Battle Pass and Goals scoped to project "Season 42 push"
- **WHEN** the list renders
- **THEN** the divider is placed among that project's goals by the same rule, using their global-plan Done By dates

#### Scenario: Grouped list

- **WHEN** Group is Type
- **THEN** no divider renders and each eligible row or card still shows its label and accent

#### Scenario: Desktop Cards view divider

- **GIVEN** the same goals in desktop Cards view at a width showing three cards per row
- **WHEN** the list renders
- **THEN** A and B sit in the first grid row, the divider spans the full grid width beneath them, and C starts the next grid row followed by D

#### Scenario: Mobile divider

- **WHEN** the same goals render below 768px
- **THEN** the divider is a list item between the B and C cards with the same text
