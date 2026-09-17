## MODIFIED Requirements

### Requirement: Home page renders the events calendar as primary content

The authenticated home page SHALL render the events calendar sourced from `eventsCalendar` after the Token Availability, Your Projects, and Daily Raids sections, as the last section on the page, on both desktop and mobile. On mobile, the calendar SHALL use the application's standard horizontal content padding.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the events calendar is rendered as the page's last section, below Token Availability and the Your Projects/Daily Raids row

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the events calendar is rendered as the last stacked section, in a layout appropriate to the smaller viewport with the application's standard horizontal content padding
