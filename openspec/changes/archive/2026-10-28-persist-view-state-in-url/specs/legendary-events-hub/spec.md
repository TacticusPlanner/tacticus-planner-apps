# Spec Delta

## MODIFIED Requirements

### Requirement: The event page shows one event with in-page sections

`/legendary-events/:eventId` SHALL render the event named by `:eventId` (the catalog `lres` id, a unit snowprint id such as `astarLysander`) as one page with a tab strip of four tabs in this order: **Overview**, Alpha, Beta, Gamma, on desktop and mobile alike. The page title is the event unit's localized name; the header shows the lifecycle badge. An unknown `:eventId` SHALL replace the route with `/legendary-events`. The old `/events/legendary-events/:eventId` route SHALL NOT exist and SHALL NOT redirect. The selected tab SHALL be the `tab` query parameter (`overview`, `alpha`, `beta`, `gamma`); a missing or unrecognized value means Overview and an unrecognized value is dropped from the URL (replace). Selecting a tab SHALL update the parameter by replacing the current history entry, so Back leaves the event page. The parameter is not carried to another event, so the tab still resets to Overview on navigation to another event, and it survives a reload of the same event. A lane tab SHALL show, in order, that lane's Lane overview, Teams section (see `legendary-event-teams`), Synced progress grid, Battles section (see `legendary-event-battle-preview`) and Eligibility leaderboard. On mobile the tab strip SHALL stay fixed below the app header while the page scrolls, so a lane can be switched from any scroll position. On desktop the strip scrolls with the page.

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

#### Scenario: Selected lane survives a reload

- **GIVEN** the user selected Beta on Lysander's page, so the URL is `/legendary-events/astarLysander?tab=beta`
- **WHEN** they reload the page
- **THEN** Beta is selected and its sections render

#### Scenario: A shared lane link opens that lane

- **WHEN** a user opens `/legendary-events/astarLysander?tab=gamma`
- **THEN** Gamma is selected

#### Scenario: Unknown tab value falls back to Overview

- **WHEN** a user opens `/legendary-events/astarLysander?tab=delta`
- **THEN** Overview is selected and the URL is replaced with `/legendary-events/astarLysander`

#### Scenario: Switching tabs adds no history entry

- **GIVEN** the user arrived at Lysander's page from `/legendary-events`
- **WHEN** they select Alpha, then Beta, then press Back
- **THEN** the hub renders
