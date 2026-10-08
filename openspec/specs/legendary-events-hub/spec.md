# legendary-events-hub Specification

## Purpose

The Legendary Events section's hub and event page: how an event's lifecycle is derived from the catalog, how the hub lists events, what the event page shows on its Overview and lane tabs, how objective labels are localized, and how loading, failure and empty states present, on desktop and mobile.

## Requirements

### Requirement: Legendary Event lifecycle is derived from catalog run dates and the finished flag

For every Legendary Event in the catalog `lres` dataset the system SHALL derive one lifecycle state from `finished` and `eventStageStartDatesUtc` (the run start dates), evaluated against the current UTC instant: `active` when some run start `s` satisfies `s <= now < s + 7 days`; otherwise `upcoming` when `finished` is false (with the earliest run start later than `now` as the next run start, or no run window when none is announced yet, shown as "to be announced"); otherwise `archived` (only `finished` archives an event). Only parseable run starts SHALL participate; an unparseable entry SHALL be ignored.

Assumptions:

- A run lasts 7 days from its start instant (V1's `getLegendaryEventDurationMillis`).
- `eventStageStartDatesUtc` lists run starts in ISO 8601 UTC; today the catalog serves one element per event (the next run).
- The run number (1–3) is not in the catalog; when the event is active it is read from the synced `currentEventRun`, and shown only when present.

#### Scenario: Run window makes an event active

- **GIVEN** Lysander's run start is 2026-08-30T00:00:00Z, `finished` is false
- **WHEN** the current instant is 2026-09-02T12:00:00Z
- **THEN** Lysander is `active`, and its run ends at 2026-09-06T00:00:00Z

#### Scenario: Boundary instants

- **GIVEN** the same run start
- **WHEN** the current instant is exactly 2026-08-30T00:00:00Z, and again exactly 2026-09-06T00:00:00Z
- **THEN** the event is `active` at the first instant and not `active` at the second

#### Scenario: Future run makes an event upcoming

- **GIVEN** Uthar's run start is 2026-10-04T00:00:00Z, `finished` is false
- **WHEN** the current instant is 2026-09-20T00:00:00Z
- **THEN** Uthar is `upcoming` with next run start 2026-10-04T00:00:00Z

#### Scenario: Finished events are archived

- **GIVEN** an event with `finished` true
- **WHEN** the lifecycle is derived
- **THEN** it is `archived`

#### Scenario: Unfinished event with no future run date is TBA

- **GIVEN** an event with `finished` false and no run start, or only run starts whose windows have passed
- **WHEN** the lifecycle is derived
- **THEN** it is `upcoming` with no run window, the hub card reads "Start date to be announced", it sorts after dated upcoming events, and it has no Home Events row

#### Scenario: Lifecycle re-evaluates while the page stays open

- **WHEN** an event's run window ends while the hub or event page is open
- **THEN** within one minute the event's lifecycle and the displayed countdown update without a reload

#### Scenario: No valid run starts

- **GIVEN** an unfinished event whose only run start is `"not-a-date"`
- **WHEN** the lifecycle is derived
- **THEN** the event is `upcoming` with no run window (TBA), because no valid run start remains

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

### Requirement: A hub row shows the event's identity, timing and synced state

Each row SHALL show the event unit's portrait and localized name and its timing: for an active event "ends in …" with the run end as a local date and time and, when the synced entry carries `currentEventRun`, "Event N of 3"; for an upcoming event the local start date and time and "starts in …"; for an upcoming event with no announced date "Start date to be announced"; for an archived event no timing. An active row additionally SHALL show synced tokens as `current/max` and points when the synced `lre-progress` chunk has an entry for the event, and "synced data unavailable" when the player-data read failed.

#### Scenario: Active row with synced state

- **GIVEN** Lysander is active and the synced entry for `astarLysander` has `currentEventRun` 2, tokens `{ current: 5, max: 12 }` and `currentPoints` 3410
- **WHEN** the hub renders
- **THEN** Lysander's row shows "Event 2 of 3", "5/12" tokens and "3,410 points"

#### Scenario: Active row without a synced entry

- **GIVEN** Lysander is active and the chunk has no entry for it
- **WHEN** the hub renders
- **THEN** the row shows the run timing and no run number, tokens or points

#### Scenario: Upcoming row

- **GIVEN** Uthar is upcoming with next run start 2026-10-04T00:00:00Z
- **WHEN** the hub renders in the `Europe/Kyiv` timezone
- **THEN** the row shows the start as 4 Oct 2026 03:00 local and "starts in …"

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

### Requirement: Run status is read from the synced progress chunk

The Run status section SHALL show, from the synced `lre-progress` entry whose `id` equals the event id: "Event N of 3" from `currentEventRun` (omitted when null); tokens `current/max` with "next token in …", counted down from the instant the chunk was observed plus `nextTokenInSeconds` and read as "next token ready" once that instant has passed (omitted when the bucket is null or full); `currentPoints`; `currentCurrency`; claimed chests as `currentClaimedChestIndex` (the Tacticus API sends a 1-based count of chests opened, and -1 when it omits the field, which reads as 0); `currentShards`; and the next points milestone: the first `lre-common` `pointsMilestones` entry whose `cumulativePoints` exceeds `currentPoints`, as "N points to milestone M (+E currency)", or "—" when no such entry exists or `lre-common` is unavailable. It SHALL show the run timing from the lifecycle and "Synced X ago" from the player-data manifest `syncedAt` (hidden while that read is pending, "Not synced yet" before the first sync). It SHALL NOT offer its own sync control. When the chunk has no entry for the event it SHALL show a "no synced progress for this event yet" body and the run timing only.

Assumptions:

- `lre-common` is one record shared by all events; its `pointsMilestones` is ordered by `cumulativePoints` ascending.
- Tokens and regeneration come from the sync, never computed locally.

#### Scenario: Populated run status

- **GIVEN** Lysander's synced entry has `currentEventRun` 1, tokens `{ current: 3, max: 12, nextTokenInSeconds: 5400 }`, `currentPoints` 3410, `currentCurrency` 120, `currentClaimedChestIndex` 4, `currentShards` 125, and the first milestone above 3,410 is `{ milestone: 14, cumulativePoints: 3500, engramPayout: 60 }`
- **WHEN** the section renders
- **AND** the chunk was observed at the current instant
- **THEN** it shows "Event 1 of 3", "3/12 tokens, next in 1 hr 30 min", "3,410 points", "120 currency", "4 chests claimed", "125 shards", and "90 points to milestone 14 (+60 currency)"

#### Scenario: Next-token countdown advances between syncs

- **GIVEN** the same entry, observed 2 hours before the current instant
- **WHEN** the section renders
- **THEN** it shows "3/12 tokens, next token ready"

#### Scenario: Event not in the synced chunk

- **GIVEN** the synced `lre-progress` array has no entry for `votanUthar`
- **WHEN** Uthar's run status renders
- **THEN** it shows the run timing and the "no synced progress for this event yet" body

#### Scenario: Last-synced age

- **GIVEN** the player-data manifest `syncedAt` is 25 minutes before now
- **WHEN** the section renders
- **THEN** it shows "Synced 25 minutes ago" and no sync button inside the section

### Requirement: Objective labels and icons are derived from the catalog filter

An objective's display label SHALL be built from its catalog filter `{ kind, target, exclude }`, not from the catalog's English `name`: `Trait` → the `traits` entry for `target`; `DamageType` → the `damageTypes` entry; `Faction` → the `factions` entry; `Alliance` → the `common:alliances` entry; `MinHits` / `MaxHits` → the `legendaryEvents` templates "Min {{n}} hits" / "Max {{n}} hits"; `AttackType` → "Ranged", and with `exclude` "Melee"; any other `exclude: true` label is the template "No {{label}}". When a namespace lacks the target the catalog `name` is the fallback. Each objective SHALL carry an icon: trait, damage-type or faction icon for those kinds; a hits glyph for Min/Max hits; a ranged or melee glyph for attack type.

#### Scenario: Trait label in German

- **GIVEN** the UI language is `de` and `traits:Resilient` is "Widerstandsfähig"
- **WHEN** the `No Resilient` objective label renders
- **THEN** it reads the German "No {{label}}" template applied to "Widerstandsfähig", with the Resilient trait icon

#### Scenario: Hits label

- **WHEN** the `{ kind: "MinHits", target: "5" }` objective label renders in English
- **THEN** it reads "Min 5 hits"

#### Scenario: Fallback to catalog name

- **GIVEN** a `DamageType` target with no `damageTypes` entry
- **WHEN** the label renders
- **THEN** the catalog `name` is shown

### Requirement: Lane overview section

For each lane the Lane overview SHALL show the lane's label (Alpha / Beta / Gamma) with the allowed-alliance rule derived from `allowedUnitsFilter` (for example "Alpha · No Xenos"), kill points per battle, the five objectives as chips with icon, label and score, the battle count, the per-battle points ladder (`battlesPoints`) as a compact bar row, and a collapsed "how points work" disclosure explaining kill points, objective scores, defeat-all and high-score points in one paragraph.

#### Scenario: Lane card content

- **WHEN** Lysander's Lane overview renders
- **THEN** the Alpha card shows "Alpha · No Xenos", "32 kill points per battle", five chips (Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40), "18 battles", an 18-bar ladder starting 32, 28, 33 and ending 64, 57, and the collapsed disclosure

### Requirement: Loading and failure states are distinct

While the catalog `lres` read is pending the hub and event page SHALL show a skeleton body. If it fails they SHALL show an error body with a retry action that re-runs the read. If the catalog read succeeds and the player-data read fails, the hub rows and the Run status section SHALL still render catalog-derived content and show "synced data unavailable" where synced values would appear.

#### Scenario: Catalog pending

- **WHEN** the `lres` dataset has not loaded
- **THEN** the hub shows a skeleton list and no headings

#### Scenario: Catalog failure

- **WHEN** the `lres` read rejects
- **THEN** the hub shows the error body with Retry, and Retry re-issues the read

#### Scenario: Player data unavailable

- **GIVEN** the catalog loaded and the player-data chunk read rejected
- **WHEN** the event page renders
- **THEN** Run status shows the run timing and "synced data unavailable" in place of run, tokens, points, currency, chests and shards

### Requirement: The Events pages have Joyride tours

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, the tab strip, the Run status card, the Overview lane summary and the cross-lane leaderboard, then (after switching to Alpha) the lane overview, the progress grid and the leaderboard; the same steps on desktop and mobile. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip, Run status, the lane summary and the cross-lane leaderboard, then Alpha's lane overview, progress grid and leaderboard, each target visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and the lane steps follow the switch to Alpha, each target scrolled into view

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
