## Purpose

Gives players a dynamically rendered events calendar as the home page's primary content, so they can see what's running, what's confirmed vs. projected, and what's coming up without leaving the app.

## Requirements

### Requirement: Home page renders the events calendar as primary content

The authenticated home page SHALL render the events calendar sourced from `eventsCalendar` as the last section on the page, after Your Projects, on both desktop and mobile. On mobile, the calendar SHALL use the application's standard horizontal content padding.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the events calendar is rendered as the page's last section, below Your Projects

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the events calendar is rendered as the last stacked section, as the mobile agenda, with the application's standard horizontal content padding

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

### Requirement: Mobile calendar identifies multi-day occurrence boundaries

The mobile calendar SHALL render an agenda. Entries of multi-day occurrences that started before the first day of the viewed range SHALL be listed once, in an "Ongoing" strip above the days, ordered by end and each showing "ends in …". Each day SHALL then list only its one-day occurrences and the multi-day occurrences that start or end on it, with a localized start tag on the first local day and a localized end tag on the last; intermediate days SHALL NOT list the occurrence. Days with no listed entry are omitted. One-day occurrences, including recurring Double Gold and Double XP weekend occurrences, show neither tag.

#### Scenario: Event already running

- **GIVEN** a Battle Pass ran from 2026-07-20 to 2026-08-20 and the viewed range starts 2026-08-02
- **WHEN** the mobile calendar renders
- **THEN** the Battle Pass appears once under Ongoing with "ends in …" and on no intermediate day

#### Scenario: First day of a multi-day event occurrence

- **WHEN** a multi-day occurrence starts inside the range
- **THEN** it is listed on its first local day with the start tag and not the end tag

#### Scenario: Last day of a multi-day event occurrence

- **WHEN** a multi-day occurrence ends inside the range
- **THEN** it is listed on its last local day with the end tag and not the start tag

#### Scenario: Intermediate day of a multi-day event occurrence

- **WHEN** a day falls strictly between an occurrence's first and last local day
- **THEN** the occurrence is not listed on that day

#### Scenario: One-day recurring weekend occurrence

- **WHEN** the mobile calendar renders a one-day Double Gold or Double XP weekend occurrence
- **THEN** it is listed on its day with neither a start nor an end tag

#### Scenario: Nothing in range

- **WHEN** nothing is ongoing and no day has an entry
- **THEN** the mobile calendar shows its empty state

### Requirement: Event cards provide a labeled Wiki action

Activating a calendar entry (a desktop bar, a mobile agenda row or an Ongoing tile) SHALL open a details popover with the event's game icon, full name, local start-to-end range, a "Live now" badge when active, a "Projected" badge and note when unconfirmed, and, when the definition has a Wiki URL, an external button-styled action with visible localized `Wiki` text. Entries themselves SHALL NOT render the Wiki action. The popover closes with Escape or an outside click.

#### Scenario: Event has a Wiki URL

- **WHEN** the user activates an entry whose definition has a Wiki URL
- **THEN** the details popover shows an external button-styled `Wiki` action that opens the URL in a new tab

#### Scenario: Event has no Wiki URL

- **WHEN** the user activates an entry whose definition has no Wiki URL
- **THEN** the details popover shows no Wiki action

#### Scenario: Entries carry no Wiki action

- **WHEN** the calendar renders
- **THEN** no Wiki link is present until a details popover is opened

### Requirement: Mobile daily event list prioritizes daily relevance

The mobile calendar SHALL order entries within a day by duration category: non-recurring events lasting up to seven days first, recurring one-day modifiers next, and events lasting more than seven days last. Entries in the same category SHALL retain a deterministic chronological order.

#### Scenario: Limited event, recurring modifier, and long-running event overlap

- **WHEN** a day contains an active seven-day Legendary Release Event, that day's Double Gold occurrence, and an active 30-day Battle Pass
- **THEN** the mobile daily list orders them as Legendary Release Event, Double Gold, then Battle Pass

#### Scenario: Entries share a duration category

- **WHEN** two or more mobile daily-list entries have the same duration category
- **THEN** their order is deterministic and chronological

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

### Requirement: Entries are coloured by event family and show the game icon

Every calendar entry SHALL show the event's game icon (falling back to its type icon) on a neutral surface with a left stripe in its family colour. The families are Campaigns (Campaign Event, Incursion, Quest), Hero events (Legendary Event, New Character Event, Home Screen Event), PvP (Tournament Arena), Guild (Guild Raid, Guild War, Crusade), Passes & boosts (Battle Pass, Shop Event, Game Version Release, Standing Modifier) and Other. The legend SHALL show one swatch per family present in the viewed range, in that order. On desktop, an entry spanning one day SHALL show only its icon, keeping its name for assistive technology and as its tooltip.

#### Scenario: Legend lists present families

- **GIVEN** the viewed range holds a Legendary Event and a Double XP weekend
- **WHEN** the calendar renders
- **THEN** the legend shows "Hero events" and "Passes & boosts" only

#### Scenario: One-day bar on desktop

- **WHEN** the desktop grid renders a one-day Double XP entry
- **THEN** the bar shows the Double XP icon with no visible text, and its accessible name and tooltip are the event name
