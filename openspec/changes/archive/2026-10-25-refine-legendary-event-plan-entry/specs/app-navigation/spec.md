## MODIFIED Requirements

### Requirement: Events is a top-level authenticated section with Legendary Events as its child

The navigation model SHALL include a top-level **Legendary Events** section at `/legendary-events`, authenticated-only, with `mobilePlacement: "menu"` and a calendar-style icon, in the position the Events section held (after My Game, before Guild). Its children SHALL be resolved at runtime: first the static child **All events** at `/legendary-events`, which is the landing page; then one child per catalog Legendary Event in hub order (active by run start, then upcoming, then archived alphabetically), labelled with the event unit's localized name and carrying the unit's portrait, at `/legendary-events/:eventId`, with a description naming its lifecycle (active, upcoming or archived) followed by its run date in the device timezone: "Ends <date>" for an active event (the current run's end), "Starts <date>" for an upcoming one (the next run's start), and no date for an archived event or one whose start is to be announced; the page header shows this description. While the catalog read is pending or fails only All events SHALL be listed. The old `/events`, `/events/legendary-events` and `/events/legendary-events/:eventId` routes SHALL NOT exist and SHALL NOT redirect; they fall through to the app's not-found handling. The section and its static child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and last-visited-child rules for a section with children; a dynamic child SHALL be indexed by its localized name. The general navigation tour SHALL mention the Legendary Events section on desktop and mobile. `/legendary-events/:eventId` SHALL activate that event's child whatever its lifecycle: active-child resolution picks the matching child with the most specific path, so All events never shadows an event child.

#### Scenario: Desktop sidebar lists Events

- **WHEN** a signed-in user views the desktop sidebar
- **THEN** Legendary Events appears after My Game and before Guild, and activating it for the first time in the session lands on `/legendary-events`

#### Scenario: Sidebar returns to the last-visited event

- **GIVEN** the user last visited `/legendary-events/astarLysander` in this section
- **WHEN** they activate Legendary Events in the desktop sidebar again
- **THEN** they land on `/legendary-events/astarLysander`, per the last-visited-child rule

#### Scenario: Secondary nav lists active events then All events

- **GIVEN** Uthar and Farsight are active, Lysander is upcoming and Dante is archived
- **WHEN** a signed-in user opens the Legendary Events section on desktop or the mobile section tabs
- **THEN** the children read All events, Uthar, Farsight, Lysander, Dante (each event with the unit's portrait, in hub order), with Uthar's description naming it active, Lysander's upcoming and Dante's archived

#### Scenario: No active event

- **GIVEN** no event is active and Lysander is upcoming
- **WHEN** the section's children render
- **THEN** the children read All events then Lysander; while the catalog read is pending or failed only All events is listed

#### Scenario: Mobile drawer lists Events, bottom bar does not

- **WHEN** a signed-in mobile user opens the Menu drawer
- **THEN** Legendary Events and its All events child are listed with descriptions, and the bottom bar is unchanged

#### Scenario: Anonymous users do not see Events

- **WHEN** an anonymous user views the navigation (desktop sidebar or mobile drawer)
- **THEN** Legendary Events is absent, like Plan and Guild, while My Game is present with only its Collection child

#### Scenario: Search finds Legendary Events

- **GIVEN** Uthar is active and Dante is archived
- **WHEN** a user types "uthar" or "dante" into navigation search
- **THEN** the event appears under Legendary Events and selecting it opens its `/legendary-events/:eventId` page; typing "legendary" finds All events

#### Scenario: Old routes are gone

- **WHEN** a signed-in user opens `/events/legendary-events/astarLysander`, `/events/legendary-events` or `/events`
- **THEN** no Legendary Events page renders and the app's existing not-found handling applies (replace to `/home`)

#### Scenario: Detail route keeps the child active

- **WHEN** a user is on `/legendary-events/votanUthar` and Uthar is active, or on `/legendary-events/bloodDante` and Dante is archived
- **THEN** that event's child is the active tab, and on `/legendary-events` All events is active

#### Scenario: The event header names the next run date

- **GIVEN** Fabius Bile is upcoming with its next run starting on Nov 8, 2026
- **WHEN** the user opens Fabius Bile's page
- **THEN** the page header description reads "Upcoming Legendary Event · Starts Nov 8, 2026"
