# Spec Delta

## MODIFIED Requirements

### Requirement: The hub lists active, upcoming and archived events

`/legendary-events` (All events) SHALL list every catalog Legendary Event in three groups in this order: Active, Upcoming (ascending next run start), Archived (alphabetical by localized unit name). A group with no events is omitted; when no event is active an explicit "no Legendary Event is running" line heads the page. Activating a row opens `/legendary-events/:eventId`. The old `/events` and `/events/legendary-events` routes SHALL NOT exist and SHALL NOT redirect.

#### Scenario: Hub ordering

- **GIVEN** Lysander active, Uthar upcoming (2026-10-04), Farsight upcoming (2026-10-18), Dante archived
- **WHEN** the hub renders
- **THEN** the rows read Lysander, Uthar, Farsight, Dante under the Active, Upcoming and Archived headings respectively

#### Scenario: No active event

- **GIVEN** no event is active
- **WHEN** the hub renders
- **THEN** the "no Legendary Event is running" line is shown above the Upcoming group and the Active heading is absent

#### Scenario: Section root redirects

- **WHEN** a signed-in user opens `/legendary-events`
- **THEN** the hub renders in place, with no redirect; opening the old `/events` or `/events/legendary-events` falls through to the app's not-found handling instead of the hub

#### Scenario: Desktop hub layout

- **WHEN** the hub renders at or above 768px
- **THEN** rows are cards in a responsive grid, two or three per row, grouped under the headings

#### Scenario: Mobile hub layout

- **WHEN** the hub renders below 768px
- **THEN** rows are full-width stacked cards under the headings, with no horizontal scrolling

### Requirement: The event page shows one event with in-page sections

`/legendary-events/:eventId` SHALL render the event named by `:eventId` (the catalog `lres` id, a unit snowprint id such as `astarLysander`) as one page with a tab strip of four tabs in this order: **Overview**, Alpha, Beta, Gamma, on desktop and mobile alike. The page title is the event unit's localized name; the header shows the lifecycle badge. An unknown `:eventId` SHALL replace the route with `/legendary-events`. The old `/events/legendary-events/:eventId` route SHALL NOT exist and SHALL NOT redirect. The selected tab defaults to Overview, persists while on the page and resets on navigation to another event; it is in-page state, not a route. A lane tab SHALL show, in order, that lane's Lane overview, Synced progress grid and Eligibility leaderboard. On mobile the tab strip SHALL stay fixed below the app header while the page scrolls, so a lane can be switched from any scroll position. On desktop the strip scrolls with the page.

#### Scenario: Known event renders

- **WHEN** a signed-in user opens `/legendary-events/astarLysander`
- **THEN** the page title is Lysander's localized name, the lifecycle badge matches the derived state, the Overview tab is selected and the Run status card renders in it

#### Scenario: Unknown event id

- **WHEN** a user opens `/legendary-events/notAnEvent`
- **THEN** the route is replaced with `/legendary-events` and the hub renders

#### Scenario: Lane tab order

- **WHEN** the user selects Beta
- **THEN** the page shows Beta's lane overview, then its synced progress grid, then its eligibility leaderboard, and nothing from Alpha or Gamma

#### Scenario: Mobile uses one shared lane selector

- **WHEN** the page renders below 768px and the user scrolls to the bottom of Beta's leaderboard
- **THEN** the tab strip is still visible under the app header and tapping Gamma switches the content without scrolling back up

#### Scenario: Desktop shows all three lanes

- **WHEN** the page renders at or above 768px
- **THEN** the same four tabs render once above the content and no lane renders side by side with another

#### Scenario: Lane selector resets per event

- **GIVEN** the user selected Gamma on Lysander's page
- **WHEN** they open Uthar's page
- **THEN** Overview is selected

### Requirement: The Events pages have Joyride tours

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, the tab strip, the Run status card, the Overview lane summary and the cross-lane leaderboard, then (after switching to Alpha) the lane overview, the progress grid and the leaderboard; the same steps on desktop and mobile. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip, Run status, the lane summary and the cross-lane leaderboard, then Alpha's lane overview, progress grid and leaderboard, each target visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and the lane steps follow the switch to Alpha, each target scrolled into view

## ADDED Requirements

### Requirement: The Overview tab summarises the event

The Overview tab SHALL show, in order: the Run status card (unchanged from its requirement); a **lane summary** with one row per lane (Alpha, Beta, Gamma) carrying the lane's earned points of its maximum as text and a bar, and the count of fully cleared battles of the lane's battle count; and the cross-lane Eligibility leaderboard (specified in `legendary-event-eligibility`). Activating a lane summary row SHALL select that lane's tab and scroll the page so that lane's Synced progress grid is at the top of the viewport (below the sticky strip on mobile). When the synced progress read failed the lane summary SHALL show "synced data unavailable" in place of the figures; when the event has no synced entry it SHALL show 0 of the maximum for each lane.

#### Scenario: Lane summary figures

- **GIVEN** Lysander's synced entry yields Alpha 3,410 of 9,000 earned with 7 of 18 battles fully cleared
- **WHEN** Overview renders
- **THEN** the Alpha row reads "3,410 / 9,000" with a bar at about 38% and "7 / 18 battles"

#### Scenario: Lane summary jumps to the grid

- **WHEN** the user activates the Beta row
- **THEN** the Beta tab becomes selected and the Beta Synced progress grid heading is scrolled into view

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** Overview renders
- **THEN** each lane row shows "synced data unavailable" and remains activatable

### Requirement: Home links target the Legendary Events section

The Home events widget's Legendary Event rows SHALL link to `/legendary-events/:eventId` and its "open Legendary Events" link to `/legendary-events`.

#### Scenario: Home row link

- **GIVEN** Lysander is active
- **WHEN** the Home events widget renders
- **THEN** Lysander's row links to `/legendary-events/astarLysander`
