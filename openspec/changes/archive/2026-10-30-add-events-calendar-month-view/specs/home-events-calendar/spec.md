## MODIFIED Requirements

### Requirement: Calendar supports navigating across dates

The calendar SHALL offer a Week view and a Month view, chosen with a toggle and remembered on the device. The Week view SHALL show seven days starting today; the Month view SHALL show one calendar month, laid out on desktop as whole Monday-to-Sunday weeks with days outside the month muted, and on mobile as the agenda for that month. Previous and Next SHALL step by a week or a month to match the view, Today SHALL return to the current week or month, and switching view SHALL start from the current week or month. The calendar SHALL let the user move to a different date range within the data available from `eventsCalendar`, including dates beyond the initially displayed range.

#### Scenario: Switching to the month view

- **WHEN** the user selects Month
- **THEN** the calendar shows the current calendar month, labelled with the month and year, and Previous / Next move by one month

#### Scenario: Event crossing a week boundary in the month view

- **WHEN** an occurrence runs from a Saturday to the following Wednesday
- **THEN** the desktop month grid draws it as one bar at the end of the first week and another at the start of the next

#### Scenario: Navigating forward within the projection horizon

- **WHEN** the user navigates to a future date range that is within the current projection horizon
- **THEN** the calendar renders the events and placeholders available for that range

#### Scenario: Navigating to a past date range

- **WHEN** the user navigates to a past date range
- **THEN** the calendar renders whatever authored occurrences exist for that range, with no projected placeholders shown for past dates

### Requirement: Entries are coloured by event family and show the game icon

Every calendar entry SHALL show the event's game icon (falling back to its type icon) on a surface tinted with its family colour, with a left stripe in the full family colour; Other entries keep a neutral surface. The families are Campaigns (Campaign Event, Incursion, Quest), Hero events (Legendary Event, New Character Event, Home Screen Event), PvP (Tournament Arena), Guild (Guild Raid, Guild War, Crusade), Passes & boosts (Battle Pass, Shop Event, Game Version Release, Standing Modifier) and Other. The legend SHALL show one swatch per family present in the viewed range, in that order, drawn like a miniature entry. On desktop, an entry spanning one day SHALL show only its icon, keeping its name for assistive technology and as its tooltip.

#### Scenario: Legend lists present families

- **GIVEN** the viewed range holds a Legendary Event and a Double XP weekend
- **WHEN** the calendar renders
- **THEN** the legend shows "Hero events" and "Passes & boosts" only

#### Scenario: Families are distinguishable at a glance

- **WHEN** the calendar renders a Guild Raid season and a Battle Pass side by side
- **THEN** each entry's whole surface carries its own family tint, not only its stripe

#### Scenario: One-day bar on desktop

- **WHEN** the desktop grid renders a one-day Double XP entry
- **THEN** the bar shows the Double XP icon with no visible text, and its accessible name and tooltip are the event name

## ADDED Requirements

### Requirement: Guild seasons show their breaks, numbers and war phases

The calendar SHALL show a "Break" entry from each Guild Raid season's end until the next season starts. Guild Raid and Guild War seasons SHALL be labelled with a short season number ("Guild Raid S112"). A Guild War season SHALL show each war's fighting window distinctly from its preparation window on the desktop bar, and its details SHALL list every war's preparation and war times.

#### Scenario: Break between raid seasons

- **WHEN** a Guild Raid season ends a day before the next one starts
- **THEN** that day shows a Guild Raid "Break" bar
- **AND** on desktop the seasons and their breaks share one row, each placed by its start and end time

#### Scenario: Guild War phases

- **WHEN** the user opens a Guild War season's details
- **THEN** it lists six wars, each with a 24h preparation window followed by a 36h war window

### Requirement: Past events are grayed out

Entries that ended before now SHALL be drawn grayed out, so what is still to come stands out.

#### Scenario: Ended season

- **WHEN** the calendar shows a season that ended last week
- **THEN** its entry is grayed out
