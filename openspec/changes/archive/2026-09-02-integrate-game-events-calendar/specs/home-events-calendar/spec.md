## Purpose

Gives players a dynamically rendered events calendar as the home page's primary content, so they can see what's running, what's confirmed vs. projected, and what's coming up without leaving the app.

## ADDED Requirements

### Requirement: Home page renders the events calendar as primary content

The authenticated home page SHALL render the events calendar sourced from `eventsCalendar` as its primary content, on both desktop and mobile.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the events calendar is rendered as the page's primary content

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the events calendar is rendered as the page's primary content, in a layout appropriate to the smaller viewport

### Requirement: Confirmed and projected entries are visually distinguishable

The calendar SHALL visually distinguish a confirmed occurrence from a projected (unconfirmed) placeholder.

#### Scenario: Projected placeholder is marked as such

- **WHEN** the calendar renders an entry that is a projected placeholder (`confirmed: false`)
- **THEN** it is visually marked as unconfirmed/tentative, distinct from confirmed entries

### Requirement: Currently active events are indicated

The calendar SHALL indicate which visible entries are active at the current time.

#### Scenario: Today's active event is highlighted

- **WHEN** the calendar renders an entry whose window contains the current time
- **THEN** that entry is visually indicated as currently active

### Requirement: Calendar supports navigating across dates

The calendar SHALL let the user move to a different date range within the data available from `eventsCalendar`, including dates beyond the initially displayed range.

#### Scenario: Navigating forward within the projection horizon

- **WHEN** the user navigates to a future date range that is within the current projection horizon
- **THEN** the calendar renders the events and placeholders available for that range

#### Scenario: Navigating to a past date range

- **WHEN** the user navigates to a past date range
- **THEN** the calendar renders whatever authored occurrences exist for that range, with no projected placeholders shown for past dates

### Requirement: Distinct loading, failure, and empty states

The calendar SHALL present a distinct state for each of: data still loading, data failed to load, and no events found for the currently viewed date range.

#### Scenario: Calendar data is loading

- **WHEN** `eventsCalendar` has not yet finished loading
- **THEN** the calendar shows a loading state rather than an empty or partially-rendered grid

#### Scenario: Calendar data fails to load

- **WHEN** `eventsCalendar` fails to load
- **THEN** the calendar shows an explicit failure state rather than appearing empty

#### Scenario: No events in the viewed range

- **WHEN** the currently viewed date range has no calendar entries
- **THEN** the calendar shows an explicit empty state for that range rather than a blank grid
