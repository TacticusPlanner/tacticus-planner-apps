## MODIFIED Requirements

### Requirement: Home page renders the events calendar as primary content

The authenticated home page SHALL render the events calendar sourced from `eventsCalendar` as its primary content, on both desktop and mobile. On mobile, the calendar SHALL use the application's standard horizontal content padding.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the events calendar is rendered as the page's primary content

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the events calendar is rendered as the page's primary content in a layout appropriate to the smaller viewport with the application's standard horizontal content padding

### Requirement: Confirmed and projected entries are visually distinguishable

The calendar SHALL visually distinguish a confirmed occurrence from a projected (unconfirmed) placeholder without rendering a visible `Projected` tag.

#### Scenario: Projected placeholder is marked as such

- **WHEN** the calendar renders an entry that is a projected placeholder (`confirmed: false`)
- **THEN** it is visually marked as unconfirmed/tentative, distinct from confirmed entries, without a visible `Projected` tag

### Requirement: Currently active events are indicated

The calendar SHALL indicate which visible entries are active at the current time without rendering a visible `Live now` tag.

#### Scenario: Today's active event is highlighted

- **WHEN** the calendar renders an entry whose window contains the current time
- **THEN** that entry is visually indicated as currently active without a visible `Live now` tag

## ADDED Requirements

### Requirement: Mobile calendar identifies multi-day occurrence boundaries

The mobile calendar SHALL show a localized start tag only on the first local calendar day of a multi-day event occurrence and a localized end tag only on its last local calendar day. It SHALL not show either tag on intermediate days or for one-day occurrences, including recurring Double Gold and Double XP weekend occurrences.

#### Scenario: First day of a multi-day event occurrence

- **WHEN** the mobile calendar renders the first local calendar day of an event occurrence lasting more than one day
- **THEN** the event card displays the localized start tag and not the end tag

#### Scenario: Last day of a multi-day event occurrence

- **WHEN** the mobile calendar renders the last local calendar day of an event occurrence lasting more than one day
- **THEN** the event card displays the localized end tag and not the start tag

#### Scenario: Intermediate day of a multi-day event occurrence

- **WHEN** the mobile calendar renders an intermediate local calendar day of a multi-day event occurrence
- **THEN** the event card displays neither a start nor an end tag

#### Scenario: One-day recurring weekend occurrence

- **WHEN** the mobile calendar renders a one-day Double Gold or Double XP weekend occurrence
- **THEN** the event card displays neither a start nor an end tag

### Requirement: Event cards provide a labeled Wiki action

When an event definition has a Wiki URL, the calendar SHALL render an external, button-styled action with visible localized `Wiki` text. It SHALL omit the action when no Wiki URL exists.

#### Scenario: Event has a Wiki URL

- **WHEN** the calendar renders an event whose definition has a Wiki URL
- **THEN** it displays an external button-styled action with visible localized `Wiki` text that opens the URL in a new tab

#### Scenario: Event has no Wiki URL

- **WHEN** the calendar renders an event whose definition has no Wiki URL
- **THEN** it does not display a Wiki action

### Requirement: Mobile daily event list prioritizes daily relevance

The mobile calendar SHALL order entries within a day by duration category: non-recurring events lasting up to seven days first, recurring one-day modifiers next, and events lasting more than seven days last. Entries in the same category SHALL retain a deterministic chronological order.

#### Scenario: Limited event, recurring modifier, and long-running event overlap

- **WHEN** a day contains an active seven-day Legendary Release Event, that day's Double Gold occurrence, and an active 30-day Battle Pass
- **THEN** the mobile daily list orders them as Legendary Release Event, Double Gold, then Battle Pass

#### Scenario: Entries share a duration category

- **WHEN** two or more mobile daily-list entries have the same duration category
- **THEN** their order is deterministic and chronological
