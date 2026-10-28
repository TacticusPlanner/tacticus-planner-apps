## MODIFIED Requirements

### Requirement: Home page renders Your Projects after Token Availability

The authenticated home page SHALL render Your Projects full width after the Daily Raids / Upcoming events row and before the events calendar, on both desktop and mobile. Cards SHALL be laid out in a grid of one column below 768px, two at or above 768px and three at the `xl` breakpoint. The header SHALL carry an "All projects" link to `/plan/projects`.

#### Scenario: Desktop shows Projects in a grid

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Your Projects renders full width below the Daily Raids / Upcoming events row and above the calendar, its cards in two or three columns

#### Scenario: Mobile stacks all sections in order

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Right now, Daily Raids, Upcoming events, Your Projects and the events calendar render as separate full-width stacked sections in that order, project cards in one column

#### Scenario: Header link

- **WHEN** the user activates "All projects"
- **THEN** `/plan/projects` opens
