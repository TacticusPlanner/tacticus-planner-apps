# Spec Delta

## MODIFIED Requirements

### Requirement: The event page shows one event with in-page sections

`/legendary-events/:eventId` SHALL render the event named by `:eventId` (the catalog `lres` id, a unit snowprint id such as `astarLysander`) as one page with a tab strip of four tabs in this order: **Overview**, Alpha, Beta, Gamma, on desktop and mobile alike. The page title is the event unit's localized name; the header shows the lifecycle badge. An unknown `:eventId` SHALL replace the route with `/legendary-events`. The old `/events/legendary-events/:eventId` route SHALL NOT exist and SHALL NOT redirect. The selected tab defaults to Overview, persists while on the page and resets on navigation to another event; it is in-page state, not a route. A lane tab SHALL show, in order, that lane's Lane overview, Teams section (see `legendary-event-teams`), Synced progress grid, Battles section (see `legendary-event-battle-preview`) and Eligibility leaderboard. On mobile the tab strip SHALL stay fixed below the app header while the page scrolls, so a lane can be switched from any scroll position. On desktop the strip scrolls with the page.

#### Scenario: Known event renders

- **WHEN** a signed-in user opens `/legendary-events/astarLysander`
- **THEN** the page title is Lysander's localized name, the lifecycle badge matches the derived state, the Overview tab is selected and the Run status card renders in it

#### Scenario: Unknown event id

- **WHEN** a user opens `/legendary-events/notAnEvent`
- **THEN** the route is replaced with `/legendary-events` and the hub renders

#### Scenario: Lane tab order

- **WHEN** the user selects Beta
- **THEN** the page shows Beta's lane overview, then its Teams section, then its synced progress grid, then its Battles section, then its eligibility leaderboard, and nothing from Alpha or Gamma

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

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, the tab strip, the Next token card, the Run status card, its Run inputs button, the Token plan header, the Overview lane summary and the cross-lane leaderboard, then (after switching to Alpha) the lane overview, the Teams section (which holds its Add team button), the progress grid, the Battles section and the leaderboard; the same steps on desktop and mobile. The Next token step SHALL target the card in whichever state it renders (token or empty state). Every step's tooltip SHALL lie fully inside the viewport when it shows; a tall target such as an expanded Token plan is highlighted by its header, not its whole list. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip, the Next token card, Run status, Run inputs, the Token plan header, the lane summary and the cross-lane leaderboard, then Alpha's lane overview, Teams section, progress grid, Battles section and leaderboard, each target visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and the lane steps follow the switch to Alpha, each target scrolled into view

#### Scenario: Token plan step with a long plan

- **GIVEN** the Token plan is expanded with 24 tokens on a 1280 by 784 viewport
- **WHEN** the tour reaches the Token plan step
- **THEN** the Token plan header is highlighted, the tooltip's title, text and buttons are all inside the viewport, and the step does not scroll the list out of view

#### Scenario: Battles step

- **WHEN** the event page tour reaches the step after Alpha's progress grid
- **THEN** it highlights Alpha's Battles section heading on desktop and mobile, then continues with the leaderboard
