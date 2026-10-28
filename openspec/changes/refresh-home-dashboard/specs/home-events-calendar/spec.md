## MODIFIED Requirements

### Requirement: Home page renders the events calendar as primary content

The authenticated home page SHALL render the events calendar sourced from `eventsCalendar` as the last section on the page, after Your Projects, on both desktop and mobile. On mobile, the calendar SHALL use the application's standard horizontal content padding.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the events calendar is rendered as the page's last section, below Your Projects

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the events calendar is rendered as the last stacked section, as the mobile agenda, with the application's standard horizontal content padding

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

## ADDED Requirements

### Requirement: Entries are coloured by event family and show the game icon

Every calendar entry SHALL show the event's game icon (falling back to its type icon) on a neutral surface with a left stripe in its family colour. The families are Campaigns (Campaign Event, Incursion, Quest), Hero events (Legendary Event, New Character Event, Home Screen Event), PvP (Tournament Arena), Guild (Guild Raid, Guild War, Crusade), Passes & boosts (Battle Pass, Shop Event, Game Version Release, Standing Modifier) and Other. The legend SHALL show one swatch per family present in the viewed range, in that order. On desktop, an entry spanning one day SHALL show only its icon, keeping its name for assistive technology and as its tooltip.

#### Scenario: Legend lists present families

- **GIVEN** the viewed range holds a Legendary Event and a Double XP weekend
- **WHEN** the calendar renders
- **THEN** the legend shows "Hero events" and "Passes & boosts" only

#### Scenario: One-day bar on desktop

- **WHEN** the desktop grid renders a one-day Double XP entry
- **THEN** the bar shows the Double XP icon with no visible text, and its accessible name and tooltip are the event name
