# Spec Delta

## Purpose

The Events section's Legendary Release Event (LRE) hub and event page: how an event's lifecycle is derived from the catalog, how the hub lists events, what the event page shows for round status, and how loading, failure and empty states present, on desktop and mobile.

## ADDED Requirements

### Requirement: LRE lifecycle is derived from catalog stage dates and the finished flag

For every LRE in the catalog `lres` dataset the system SHALL derive one lifecycle state from `finished` and `eventStageStartDatesUtc`, evaluated against the current UTC instant:

- `active` when some stage start date `s` satisfies `s <= now < s + 7 days`;
- otherwise `upcoming` when `finished` is false and some stage start date is later than `now`; the earliest such date is the event's next stage start;
- otherwise `archived` (`finished` is true, or every stage window has passed).

Assumptions:

- An LRE stage (one occurrence) lasts 7 days from its start instant (V1's `getLegendaryEventDurationMillis`).
- `eventStageStartDatesUtc` lists stage starts in ISO 8601 UTC; today the catalog serves one element per event (the next stage).
- The stage number (1–3) is not in the catalog; when the event is active it is read from the synced `currentEventRun`, and shown only when present.

#### Scenario: Stage window makes an event active

- **GIVEN** Lysander's `eventStageStartDatesUtc` is `["2026-08-30T00:00:00Z"]`, `finished` is false
- **WHEN** the current instant is 2026-09-02T12:00:00Z
- **THEN** Lysander is `active`, and its stage ends at 2026-09-06T00:00:00Z

#### Scenario: Future stage makes an event upcoming

- **GIVEN** Uthar's stage date is 2026-10-04T00:00:00Z, `finished` is false
- **WHEN** the current instant is 2026-09-20T00:00:00Z
- **THEN** Uthar is `upcoming` with next stage start 2026-10-04T00:00:00Z

#### Scenario: Finished or expired events are archived

- **GIVEN** an event with `finished` true, and another with `finished` false whose only stage date is 2026-05-17T00:00:00Z
- **WHEN** the current instant is 2026-10-06T00:00:00Z
- **THEN** both are `archived`

#### Scenario: Lifecycle re-evaluates while the page stays open

- **WHEN** an event's stage window ends while the hub or event page is open
- **THEN** within one minute the event's lifecycle and the displayed countdown update without a reload

### Requirement: The LRE hub lists active, upcoming and archived events

`/events/lre` SHALL list every catalog LRE in three groups in this order: Active, Upcoming (ascending next stage start), Archived (alphabetical by localized unit name). A group with no events is omitted; when no event is active an explicit "no event running" line heads the page. Each row SHALL show the event unit's portrait and localized name, and timing: for an active event "ends in …" with the stage end as a local date and time and, when the synced progress carries `currentEventRun`, "Stage N of 3"; for an upcoming event the local start date and time and "starts in …"; for an archived event no timing. An active row additionally SHALL show synced tokens (`current/max`) and points when the synced chunk has that event. Activating a row opens `/events/lre/:eventId`. `/events` SHALL redirect to `/events/lre`.

#### Scenario: Hub ordering

- **GIVEN** Lysander active, Uthar upcoming (2026-10-04), Farsight upcoming (2026-10-18), Dante archived
- **WHEN** the hub renders
- **THEN** the rows read Lysander, Uthar, Farsight, Dante under the Active, Upcoming and Archived headings respectively

#### Scenario: Active row shows synced state

- **GIVEN** Lysander is active and the synced `lre-progress` entry for `astarLysander` has `currentEventRun` 2, tokens `{ current: 5, max: 12 }` and `currentPoints` 3410
- **WHEN** the hub renders
- **THEN** Lysander's row shows "Stage 2 of 3", "5/12" tokens and "3,410 points"

#### Scenario: No active event

- **GIVEN** no event is active
- **WHEN** the hub renders
- **THEN** a "no Legendary Event is running" line is shown above the Upcoming group and the Active heading is absent

#### Scenario: Section root redirects

- **WHEN** a signed-in user opens `/events`
- **THEN** they land on `/events/lre` with one history entry replaced, not added

#### Scenario: Desktop hub layout

- **WHEN** the hub renders at or above 768px
- **THEN** rows are cards in a responsive grid, two or three per row, grouped under the three headings

#### Scenario: Mobile hub layout

- **WHEN** the hub renders below 768px
- **THEN** rows are full-width stacked cards under the three headings, with no horizontal scrolling

### Requirement: The event page shows one event with four in-page sections

`/events/lre/:eventId` SHALL render the event named by `:eventId` (the catalog `lres` id, a unit snowprint id such as `astarLysander`) with, in order: Round status, Track overview, Eligibility leaderboard, Synced progress. The last three are defined by `lre-eligibility` and `lre-synced-progress`. The page title is the event unit's localized name; the header shows its lifecycle state. An unknown `:eventId` SHALL replace the route with `/events/lre`. Sections are parts of one scrollable page, not sibling routes; on mobile the three track-scoped sections share one Alpha / Beta / Gamma track selector whose value defaults to Alpha, persists while the user stays on the page and resets on navigation to another event.

#### Scenario: Known event renders

- **WHEN** a signed-in user opens `/events/lre/astarLysander`
- **THEN** the page title is Lysander's localized name, the lifecycle badge matches the derived state, and the four sections render in order

#### Scenario: Unknown event id

- **WHEN** a user opens `/events/lre/notAnEvent`
- **THEN** the route is replaced with `/events/lre` and the hub renders

#### Scenario: Desktop shows all three tracks side by side

- **WHEN** the event page renders at or above 768px
- **THEN** Track overview, Eligibility leaderboard and Synced progress each show Alpha, Beta and Gamma as three columns or three adjacent panels with no track selector

#### Scenario: Mobile uses one shared track selector

- **WHEN** the event page renders below 768px
- **THEN** one Alpha / Beta / Gamma segmented control sits above the track-scoped sections, defaults to Alpha, and switching it changes all three sections together

#### Scenario: Track selector resets per event

- **GIVEN** the user selected Gamma on Lysander's page on mobile
- **WHEN** they open Uthar's page
- **THEN** the selector shows Alpha

### Requirement: Round status is read from the synced progress chunk

The Round status section SHALL show, from the synced `lre-progress` entry whose `id` equals the event id: stage "N of 3" from `currentEventRun` (omitted when null), tokens `current/max` with "next token in …" from `nextTokenInSeconds` (omitted when the bucket is null), points `currentPoints`, currency `currentCurrency`, claimed chests as `currentClaimedChestIndex + 1`, shards `currentShards`, and the next points milestone: the first `lre-common` `pointsMilestones` entry whose `cumulativePoints` exceeds `currentPoints`, as "N points to milestone M (+E engrams)". It SHALL show the stage timing from the lifecycle (ends in / starts in) and "Synced X ago" from the player-data manifest `syncedAt`. It SHALL NOT offer its own sync control; the shell's existing Sync action is the refresh path. When the chunk has no entry for the event the section SHALL show a "no synced progress for this event yet" body and the timing only.

Assumptions:

- `lre-common` is one record shared by all events; its `pointsMilestones` is ordered by `cumulativePoints` ascending.
- Token regeneration and counts come from the sync, never computed locally.

#### Scenario: Populated round status

- **GIVEN** Lysander's synced entry has `currentEventRun` 1, tokens `{ current: 3, max: 12, nextTokenInSeconds: 5400 }`, `currentPoints` 3410, `currentCurrency` 120, `currentClaimedChestIndex` 4, `currentShards` 125, and `lre-common` milestones include `{ milestone: 14, cumulativePoints: 3500, engramPayout: 60 }` as the first above 3,410
- **WHEN** the section renders
- **THEN** it shows "Stage 1 of 3", "3/12 tokens, next in 1 hr 30 min", "3,410 points", "120 currency", "5 chests claimed", "125 shards", and "90 points to milestone 14 (+60 engrams)"

#### Scenario: Event not in the synced chunk

- **GIVEN** the synced `lre-progress` array has no entry for `votanUthar`
- **WHEN** Uthar's round status renders
- **THEN** it shows the stage timing and the "no synced progress for this event yet" body, and the other sections still render

#### Scenario: Last-synced age

- **GIVEN** the player-data manifest `syncedAt` is 25 minutes before now
- **WHEN** the section renders
- **THEN** it shows "Synced 25 min ago" and no sync button inside the section

### Requirement: Loading and failure states are distinct

While the catalog `lres` read or the player-data read is pending the hub and event page SHALL show a skeleton body. If the catalog read fails they SHALL show an error body with a retry action that re-runs the read. If the catalog read succeeds and the player-data read fails or has not completed, the hub and the Round status section SHALL still render catalog-derived content and show "synced data unavailable" where synced values would appear; the leaderboard and progress sections follow their own specs for missing roster or progress data.

#### Scenario: Catalog pending

- **WHEN** the `lres` dataset has not loaded
- **THEN** the hub shows a skeleton list and no headings

#### Scenario: Catalog failure

- **WHEN** the `lres` read rejects
- **THEN** the hub shows the error body with Retry, and Retry re-issues the read

#### Scenario: Player data unavailable

- **GIVEN** the catalog loaded and the player-data chunk read rejected
- **WHEN** the event page renders
- **THEN** Round status shows the timing and "synced data unavailable" in place of tokens, points, currency, chests and shards

### Requirement: The Events pages have Joyride tours

The LRE hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour with steps for Round status, Track overview, the leaderboard and the progress grid; on mobile the tour additionally targets the track selector. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/events/lre/astarLysander` at or above 768px
- **THEN** steps highlight Round status, Track overview, the leaderboard and the progress grid in that order

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** a step highlights the track selector before the track-scoped sections
