## MODIFIED Requirements

### Requirement: Right now shows the live events

Right now SHALL show each live event as a tile with a visible LIVE label (text, not colour alone) and an "ends in …" countdown, in the order: every running Home Screen Event (the one the HSE tab opens on first), the Legendary Event, Campaign Event, Incursion, Quest, Hero Release Event, then event shop. A live Legendary Event tile SHALL show the featured hero's portrait and, when the synced entry exists, its run ("Event N of 3") and points. A live Home Screen Event tile SHALL show the theme's game banner as a darkened backdrop when the datamine has one, and its medallion otherwise. An event shop is live from its `startUtc` for `dayCount` days; a shop with no start date is never live. When nothing is live, Right now SHALL say so in place of the tiles. Activity is decided by UTC instants (start inclusive, end exclusive).

#### Scenario: Two live events

- **GIVEN** Machine Hunt is live (ends 2026-10-05T08:00Z) and Lysander's run is live with run 2 and 3,410 synced points
- **WHEN** Home renders at 2026-10-03T12:00Z
- **THEN** Right now shows a Machine Hunt tile and a Lysander tile, both marked LIVE with "ends in …", the Lysander tile with his portrait, "Event 2 of 3" and "3,410 points"

#### Scenario: Overlapping Home Screen Events

- **GIVEN** Blood Tithe and a Faction Boost both run 2026-11-22T08:00Z to 2026-11-29T08:00Z
- **WHEN** Home renders at 2026-11-24T12:00Z
- **THEN** Right now shows a tile for each

#### Scenario: Hero Release Event and event shop

- **GIVEN** the Daras Hero Release Event runs from 2026-11-22 and the Skull Harvest shop from 2026-11-23
- **WHEN** Home renders at 2026-11-24T12:00Z
- **THEN** Right now shows "New Character Event: Daras" and "Skull Harvest" tiles, both LIVE

#### Scenario: Live Legendary Event without a synced entry

- **GIVEN** Lysander's run is live and the player has no synced entry for it
- **WHEN** Home renders
- **THEN** the Lysander tile shows no run or points

#### Scenario: Nothing live

- **GIVEN** no event is live
- **WHEN** Home renders
- **THEN** Right now shows a "nothing live" note beside the tokens

### Requirement: Upcoming events lists the next three, the Legendary Event always among them

Upcoming events SHALL show the next occurrence of each kind that has not started: the Home Screen Events that start first (several when they start together; same selection as the HSE tab), the next Legendary Event with a known start (catalog `lres`, lifecycle per `legendary-events-hub`), the Campaign Event, Incursion, Quest, Hero Release Event and event shop, in ascending start order, each with its local start date and time and a "starts in …" countdown. The card SHALL show the first three rows and a "Show N more" toggle for the rest; expanded, it SHALL also offer a "View calendar" button that scrolls Home's Events calendar into view; when no Legendary Event is live and the next one is not among the first three, it SHALL replace the third collapsed row, so a Legendary Event is always visible in Right now or Upcoming events. A kind's next occurrence SHALL be listed even while another of the same kind runs. The event shop row SHALL be the next dated shop, else the first shop with no start date, which reads "Start date TBA" without a countdown and sorts last. Ordering uses UTC instants; the device timezone only affects the displayed start text, and rows and countdowns use the same instant. The countdowns in Right now, Upcoming events and the calendar's Ongoing list SHALL keep the hours from a day out ("3 days 12 hr", whole days and hours, zero hours dropped), and use hours and minutes under a day.

Assumptions:

- Local time is the device timezone; event windows stay UTC.

#### Scenario: Live events are not repeated

- **GIVEN** Machine Hunt and Lysander are live, Training Rush starts 2026-10-09T08:00Z and Uthar starts 2026-10-11T00:00Z
- **WHEN** Home renders at 2026-10-03T12:00Z
- **THEN** Upcoming events lists Training Rush ("starts in 5 days 20 hr") then Uthar, and neither Machine Hunt nor Lysander

#### Scenario: One row per kind

- **GIVEN** Squig Smash starts 2026-11-18, a Campaign Event 2026-11-19, the Daras Hero Release Event 2026-11-22, Blood Tithe 2026-11-22T08:00Z, the Skull Harvest shop 2026-11-23, a Quest 2026-11-25, an Incursion 2026-12-07 and Lysander 2026-12-13
- **WHEN** Home renders at 2026-11-15
- **THEN** Upcoming events lists Squig Smash, the Campaign Event and the next Legendary Event, with "Show 4 more" revealing the Hero Release Event, Skull Harvest, the Quest and the Incursion, and never Blood Tithe (a later Home Screen Event)

#### Scenario: Legendary Event pinned to the third row

- **GIVEN** nothing is live, a Home Screen Event starts 2026-10-04, a Campaign Event 2026-10-06, a Quest 2026-10-08, an Incursion 2026-10-10, and Uthar starts 2026-10-11
- **WHEN** Home renders
- **THEN** the collapsed card lists the Home Screen Event, the Campaign Event, then Uthar, and "Show 2 more" reveals the Quest and the Incursion

#### Scenario: Cap of three

- **GIVEN** a live Legendary Event and four upcoming rows of other kinds
- **WHEN** Home renders
- **THEN** the collapsed card lists only the three earliest rows and a "Show 1 more" toggle

#### Scenario: Show more

- **GIVEN** five upcoming rows
- **WHEN** the user activates "Show 2 more"
- **THEN** all five rows show in start order, the toggle reads "Show less", and a "View calendar" button appears that scrolls the Events calendar into view

#### Scenario: Shop with no start date

- **GIVEN** no dated shop is coming and the `december-2026` shop has no start date
- **WHEN** Home renders
- **THEN** Upcoming events lists it last (behind "Show more" when more than three rows) with "Start date TBA" and no countdown, and Right now does not

#### Scenario: Timezone changes display only

- **GIVEN** an event starts at 2026-10-09T08:00:00Z
- **WHEN** Home renders with the device in `Pacific/Honolulu` and again in `UTC`
- **THEN** the displayed local start differs by the offset, while which rows are shown is identical

### Requirement: Each row opens its own destination

Each event row and tile SHALL contain a link (activatable by click, tap and Enter, and openable in a new tab): a Home Screen Event navigates to `/dailies/hse?event=<instance key>` and a Hero Release Event to `/dailies/hre?event=<instance key>` (the tab's switcher key: the occurrence id, else `definitionId@startUtc`), so the tab opens on that very instance; a Legendary Event navigates to `/legendary-events/:eventId`; a Quest to `/dailies/quest`; an event shop to `/dailies/event-shop/<shop id>`. Neither card SHALL navigate as a whole, and the plan action is a separate control.

#### Scenario: HSE row opens the HSE tab

- **WHEN** the user activates the Machine Hunt tile
- **THEN** the app navigates to `/dailies/hse?event=<Machine Hunt's instance key>` and the HSE tab shows Machine Hunt

#### Scenario: Legendary Event row opens the event page

- **WHEN** the user activates the Lysander tile
- **THEN** the app navigates to `/legendary-events/astarLysander`

#### Scenario: Event shop row opens its shop

- **WHEN** the user activates the Skull Harvest row
- **THEN** the app navigates to `/dailies/event-shop/november-2026`

#### Scenario: Keyboard activation

- **WHEN** a row link has focus and the user presses Enter
- **THEN** that row's navigation occurs

### Requirement: Event rows use the game's art

Home Screen Event rows and tiles SHALL show the theme's game medallion from the datamine (Blood Tithe: `liveevents/ui_gamemodeicon_global_hse_blood_tithe`); a Faction Boost SHALL use that faction's medallion, or the faction icon when the datamine has none. A Hero Release Event SHALL show its featured hero's portrait (else the HRE icon), and an event shop the shop event icon. Countdowns SHALL show the game's timer icon. An event with no datamined art SHALL fall back to its event-type icon, never an empty slot. Images are decorative; the row text names the event.

#### Scenario: Known theme

- **WHEN** a Machine Hunt row renders
- **THEN** it shows `liveevents/ui_gamemodeicon_machinehunt`

#### Scenario: No art

- **WHEN** an Against the Tide row renders
- **THEN** it shows the Home Screen Event type icon
