## MODIFIED Requirements

### Requirement: Home page renders Daily Raids after Your Projects

The authenticated home page SHALL render Daily Raids directly after Right now. At or above the 768px breakpoint it SHALL share a row with Upcoming events, Daily Raids taking 3 of 5 columns; below 768px it stacks full width before Upcoming events (see `home-events-widget` "Home renders Right now and Upcoming events cards").

#### Scenario: Desktop shows Daily Raids beside Upcoming events

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Daily Raids renders in the wider column beside Upcoming events, below Right now and above Your Projects

#### Scenario: Mobile stacks Daily Raids after Right now

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Daily Raids renders full width after Right now and before Upcoming events

## ADDED Requirements

### Requirement: The widget shows ten locations, the rest on demand

The widget SHALL show the first 10 locations of its list. When more exist it SHALL show a "Show N more" control (N the hidden count) that reveals all of them and becomes "Show less", and exposes its state with `aria-expanded`. The expanded state is not persisted.

#### Scenario: Twelve locations

- **GIVEN** today's schedule has 12 locations
- **WHEN** the widget renders
- **THEN** 10 rows show with "Show 2 more"; activating it shows all 12 and the control reads "Show less"

#### Scenario: Ten or fewer

- **GIVEN** today's schedule has 10 locations
- **WHEN** the widget renders
- **THEN** all 10 show and no toggle is rendered

### Requirement: The widget links to Today from its header

The widget header SHALL carry an "Open Today" link to `/dailies/raids`. The card itself SHALL NOT be a button or navigate as a whole, so its rows and the show-more control work on their own.

#### Scenario: Header opens Today

- **WHEN** the user activates "Open Today"
- **THEN** Today (`/dailies/raids`) opens; the widget passes no project to it

#### Scenario: Card body does not navigate

- **WHEN** the user clicks the card outside the link and the toggle
- **THEN** nothing navigates

## REMOVED Requirements

### Requirement: Activating the widget navigates to Today

**Reason**: Whole-card navigation conflicts with the show-more control and hides that the card is clickable.

**Migration**: See "The widget links to Today from its header".
