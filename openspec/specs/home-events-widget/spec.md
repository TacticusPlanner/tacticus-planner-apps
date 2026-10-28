## Purpose

Defines Home's event cards: the live half of the "Right now" card and the "Upcoming events" card, which Home Screen Events and Legendary Events each lists, the pinned Legendary Event and its plan action, the game art on rows, per-row navigation, distinct loading, error and empty states, and their Home tour steps.

## Requirements

### Requirement: Home renders Right now and Upcoming events cards

The authenticated home page SHALL render, as its first card, a "Right now" card (localized) holding Token Availability and the live events, and a separate "Upcoming events" card (localized) for events that have not started. Both are distinct from, and do not replace, the "Events calendar". The page SHALL use the shared page container, so it has the same padding and maximum width as every other page. At or above the 1024px (`lg`) breakpoint Daily Raids, Your Projects and Upcoming events SHALL share one row of three equal columns, in that order. Below 1024px the cards SHALL stack in the order Right now, Daily Raids, Upcoming events, Your Projects, Events calendar.

#### Scenario: Desktop layout

- **WHEN** a signed-in user opens `/home` at or above 1024px
- **THEN** Right now spans the full width first, then Daily Raids, Your Projects and Upcoming events share one row, then the calendar

#### Scenario: Mobile layout

- **WHEN** a signed-in user opens `/home` below 1024px
- **THEN** Right now, Daily Raids, Upcoming events, Your Projects and the calendar render full width in that order

#### Scenario: Calendar is not the same card

- **WHEN** the home page renders
- **THEN** Right now, Upcoming events and the Events calendar are present and separately titled

### Requirement: Right now shows the live events

Right now SHALL show each live Home Screen Event and live Legendary Event as a tile with a visible LIVE label (text, not colour alone) and an "ends in …" countdown. A live Legendary Event tile SHALL show the featured hero's portrait and, when the synced entry exists, its run ("Event N of 3") and points. A live Home Screen Event tile SHALL show the theme's game banner as a darkened backdrop when the datamine has one, and its medallion otherwise. When nothing is live, Right now SHALL say so in place of the tiles. Activity is decided by UTC instants (start inclusive, end exclusive).

Assumptions:

- At most one Home Screen Event and at most one Legendary Event are live at a time.

#### Scenario: Two live events

- **GIVEN** Machine Hunt is live (ends 2026-10-05T08:00Z) and Lysander's run is live with run 2 and 3,410 synced points
- **WHEN** Home renders at 2026-10-03T12:00Z
- **THEN** Right now shows a Machine Hunt tile and a Lysander tile, both marked LIVE with "ends in …", the Lysander tile with his portrait, "Event 2 of 3" and "3,410 points"

#### Scenario: Live Legendary Event without a synced entry

- **GIVEN** Lysander's run is live and the player has no synced entry for it
- **WHEN** Home renders
- **THEN** the Lysander tile shows no run or points

#### Scenario: Nothing live

- **GIVEN** no Home Screen Event or Legendary Event is live
- **WHEN** Home renders
- **THEN** Right now shows a "nothing live" note beside the tokens

### Requirement: Upcoming events lists the next three, the Legendary Event always among them

Upcoming events SHALL show at most three rows of events that have not started, Home Screen Events (same selection as the HSE tab) and Legendary Events (catalog `lres`, lifecycle per `legendary-events-hub`) together, in ascending start order, each with its local start date and time and a "starts in …" countdown. When no Legendary Event is live and the next upcoming Legendary Event would not be among the first three, it SHALL replace the third row, so a Legendary Event is always visible in either Right now or Upcoming events. Ordering uses UTC instants; the device timezone only affects the displayed start text, and rows and countdowns use the same instant. The countdowns in Right now, Upcoming events and the calendar's Ongoing list SHALL keep the hours from a day out ("3 days 12 hr", whole days and hours, zero hours dropped), and use hours and minutes under a day.

Assumptions:

- Local time is the device timezone; event windows stay UTC.

#### Scenario: Live events are not repeated

- **GIVEN** Machine Hunt and Lysander are live, Training Rush starts 2026-10-09T08:00Z and Uthar starts 2026-10-11T00:00Z
- **WHEN** Home renders at 2026-10-03T12:00Z
- **THEN** Upcoming events lists Training Rush ("starts in 5 days 20 hr") then Uthar, and neither Machine Hunt nor Lysander

#### Scenario: Legendary Event pinned to the third row

- **GIVEN** nothing is live, four Home Screen Events start on 2026-10-04, 2026-10-06, 2026-10-08 and 2026-10-10, and Uthar starts 2026-10-11
- **WHEN** Home renders
- **THEN** Upcoming events lists the 2026-10-04 and 2026-10-06 events, then Uthar

#### Scenario: Cap of three

- **GIVEN** a live Legendary Event and four upcoming Home Screen Events
- **WHEN** Home renders
- **THEN** Upcoming events lists only the three earliest Home Screen Events

#### Scenario: Timezone changes display only

- **GIVEN** an event starts at 2026-10-09T08:00:00Z
- **WHEN** Home renders with the device in `Pacific/Honolulu` and again in `UTC`
- **THEN** the displayed local start differs by the offset, while which rows are shown is identical

### Requirement: Legendary Event rows carry a plan action

Every Legendary Event tile in Right now and row in Upcoming events SHALL carry a plan action beside, not inside, its row link: when exactly one active project targets that event, an "Open project" link to `/plan/goals?project=<id>`; when several do, a menu labelled with their count listing each project as a link to `/plan/goals?project=<id>`; otherwise (no project, signed out, or the projects read failed), a "Plan this event" link to the event's plan wizard, `/legendary-events/:eventId/plan`. While projects load, the action SHALL show a placeholder.

#### Scenario: No project targets the event

- **GIVEN** Uthar is upcoming and no project targets it
- **WHEN** Home renders
- **THEN** Uthar's row shows "Plan this event" linking to `/legendary-events/votanUthar/plan`

#### Scenario: One project targets the event

- **GIVEN** project "Lysander push" (id `p1`) targets Lysander's event
- **WHEN** Home renders
- **THEN** the Lysander tile shows "Open project" linking to `/plan/goals?project=p1`

#### Scenario: Several projects target the event

- **GIVEN** projects "Uthar A" and "Uthar B" target Uthar's event
- **WHEN** the user opens Uthar's "2 projects" menu
- **THEN** it lists both, each linking to `/plan/goals?project=<id>`

### Requirement: Event rows use the game's art

Home Screen Event rows and tiles SHALL show the theme's game medallion from the datamine; a Faction Boost SHALL use that faction's medallion, or the faction icon when the datamine has none. Countdowns SHALL show the game's timer icon. An event with no datamined art SHALL fall back to its event-type icon, never an empty slot. Images are decorative; the row text names the event.

#### Scenario: Known theme

- **WHEN** a Machine Hunt row renders
- **THEN** it shows `liveevents/ui_gamemodeicon_machinehunt`

#### Scenario: No art

- **WHEN** an Against the Tide row renders
- **THEN** it shows the Home Screen Event type icon

### Requirement: Distinct loading, error and empty states

Upcoming events SHALL show a distinct loading body while either read is pending, a distinct error body when both reads failed, and a distinct empty body when the reads succeeded but no event of either type is upcoming ("no events scheduled"), with inline links to `/dailies/hse` and `/legendary-events`. When exactly one source fails, the rows of the other source SHALL still render, with an inline "could not load <type>" note for the failed one. Right now SHALL show a loading placeholder for its events while either read is pending, and its "nothing live" note when both reads failed; read failures are reported only in Upcoming events.

#### Scenario: Loading

- **WHEN** the calendar read or the catalog read has not resolved
- **THEN** Upcoming events shows its loading body and Right now its events placeholder

#### Scenario: Read failure

- **WHEN** both the calendar read and the catalog read fail
- **THEN** Upcoming events shows its error body, Right now shows "nothing live", and Home still renders

#### Scenario: One source fails

- **GIVEN** the calendar read failed and the catalog read succeeded with Uthar upcoming
- **WHEN** Home renders
- **THEN** Uthar's row renders and an inline note says Home Screen Events could not be loaded

#### Scenario: Nothing scheduled

- **WHEN** both reads succeed and nothing is live or upcoming
- **THEN** Upcoming events shows the empty body with the two inline links

### Requirement: The card has a Home tour step

The Home page tour SHALL include a step targeting Right now (tokens and live events) and a step targeting Upcoming events (mentioning both event types and the plan action), on desktop and mobile, with localized title and content. The steps SHALL run in page order: Right now, Daily Raids, Upcoming events, Your Projects, calendar navigation, calendar.

#### Scenario: Tour covers the cards

- **WHEN** the Home tour runs on desktop or mobile
- **THEN** one step highlights Right now and a later step, after Daily Raids, highlights Upcoming events

### Requirement: Each row opens its own destination

Each event row and tile SHALL contain a link (activatable by click, tap and Enter, and openable in a new tab): a Home Screen Event navigates to `/dailies/hse?event=<instance key>` (the HSE tab's switcher key: the occurrence id, else `definitionId@startUtc`), so the tab opens on that very instance; a Legendary Event navigates to `/legendary-events/:eventId`. Neither card SHALL navigate as a whole, and the plan action is a separate control.

#### Scenario: HSE row opens the HSE tab

- **WHEN** the user activates the Machine Hunt tile
- **THEN** the app navigates to `/dailies/hse?event=<Machine Hunt's instance key>` and the HSE tab shows Machine Hunt

#### Scenario: Legendary Event row opens the event page

- **WHEN** the user activates the Lysander tile
- **THEN** the app navigates to `/legendary-events/astarLysander`

#### Scenario: Keyboard activation

- **WHEN** a row link has focus and the user presses Enter
- **THEN** that row's navigation occurs
