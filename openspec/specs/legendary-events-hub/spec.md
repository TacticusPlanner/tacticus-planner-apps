# legendary-events-hub Specification

## Purpose

The Legendary Events section's hub and event page: how an event's lifecycle is derived from the catalog, how the hub lists events, what the event page shows on each of its tabs, how objective labels are localized, and how loading, failure and empty states present, on desktop and mobile.

## Requirements

### Requirement: Legendary Event lifecycle is derived from catalog run dates

For every Legendary Event in the catalog `lres` dataset the system SHALL derive one lifecycle state from `eventStageStartDatesUtc` (the run start dates), evaluated against the current UTC instant: `active` when some run start `s` satisfies `s <= now < s + 7 days`; otherwise `archived` when the event is finished; otherwise `upcoming` (with the earliest run start later than `now` as the next run start, or no run window when none is announced yet, shown as "to be announced"). An event is finished when all three run starts are listed and parseable and `now` is at or after run 3's start + 7 days; the catalog carries no `finished` flag. Only parseable run starts SHALL participate; an unparseable entry SHALL be ignored.

Assumptions:

- A run lasts 7 days from its start instant (V1's `getLegendaryEventDurationMillis`).
- `eventStageStartDatesUtc` lists the announced run starts in ISO 8601 UTC, index = run − 1, at most three (the API's `legendary-event-run-schedule`).
- The run number is derived from the index of the run start and the clock (`legendary-event-run-resolution`); the synced `currentEventRun` is sent only while a run is active and wins then, and is null between runs.

#### Scenario: Run window makes an event active

- **GIVEN** Lysander's run start is 2026-08-30T00:00:00Z
- **WHEN** the current instant is 2026-09-02T12:00:00Z
- **THEN** Lysander is `active`, and its run ends at 2026-09-06T00:00:00Z

#### Scenario: Boundary instants

- **GIVEN** the same run start
- **WHEN** the current instant is exactly 2026-08-30T00:00:00Z, and again exactly 2026-09-06T00:00:00Z
- **THEN** the event is `active` at the first instant and not `active` at the second

#### Scenario: Future run makes an event upcoming

- **GIVEN** Uthar's run start is 2026-10-04T00:00:00Z
- **WHEN** the current instant is 2026-09-20T00:00:00Z
- **THEN** Uthar is `upcoming` with next run start 2026-10-04T00:00:00Z

#### Scenario: Finished events are archived

- **GIVEN** an event whose three run starts are 2025-06-01, 2025-10-05 and 2026-02-01 (00:00 UTC)
- **WHEN** the lifecycle is derived at 2026-02-08T00:00:00Z or later
- **THEN** it is `archived`; at 2026-02-07T23:59:59Z it is still `active` (run 3)

#### Scenario: Unfinished event with no future run date is TBA

- **GIVEN** an event with fewer than three run starts, none of whose windows is current or in the future (no run start, or only run starts whose windows have passed)
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

`/legendary-events/:eventId` SHALL render the event named by `:eventId` (the catalog `lres` id, a unit snowprint id such as `astarLysander`) as one page with a tab strip of four tabs in this order: **Overview**, **Teams**, **Plan** and the **run tab**, on desktop and mobile alike; the strip scrolls sideways when it does not fit. The run tab SHALL be named "Current run" while the event is active, "Next run" while it is upcoming and "Last run" once it is archived. The default tab SHALL be the run tab while the event is active, and Overview otherwise. The page title is the event unit's localized name; the header shows the lifecycle badge. An unknown `:eventId` SHALL replace the route with `/legendary-events`. The old `/events/legendary-events/:eventId` route SHALL NOT exist and SHALL NOT redirect.

- **Overview** shows the lane summary, then the plan notes (see "The Overview tab summarises the event").
- **Teams** shows the Event board, then one Eligibility leaderboard (see "The Teams tab shows an Event board of the shown lanes").
- **Plan** shows, in order, the collapsible Run forecast (see `legendary-event-run-forecast`), the Token plan, open by default (see `legendary-event-token-plan`), then every lane's Upgrade impact section, each naming its lane (see `legendary-event-upgrade-impact`), and one lane's Battles section, whose lane is picked in a dropdown in its battle row (see `legendary-event-battle-preview`). Plan shows no lane selection.
- **The run tab** shows, in order, the Next token card with the tokens up next (see `legendary-event-token-plan`), the Run status card, the shown lanes' Synced progress grids and the Last run card (see `legendary-event-run-history`).

The Teams and run tabs' lane blocks (the Event board's columns, the leaderboard and the progress grids) SHALL follow one **lane selection** for the page, remembered per browser and shown above the blocks: on desktop a segmented control with a toggle per lane, pressed (with a check) while it shows, shows one, two or all three lanes (all three by default; pressing the last shown lane leaves it shown), and below 768px an Alpha / Beta / Gamma segmented single choice shows one lane at a time (the first selected lane).

The selected tab SHALL be the `tab` query parameter (`overview`, `teams`, `plan`, `run`; missing means the default tab, which is left out of the URL). An unrecognized value SHALL fall back to the default and be dropped from the URL (replace); a lane id in `tab` (a link from before the Teams tab, such as `?tab=beta`) SHALL open Teams with that lane shown and be rewritten to `?tab=teams`. Selecting a tab SHALL update the parameter by replacing the current history entry, so Back leaves the event page. The parameter is not carried to another event, so the tab resets to that event's default on navigation to another event, and it survives a reload of the same event. On mobile the tab strip SHALL stay fixed below the app header while the page scrolls, so a tab can be switched from any scroll position. On desktop the strip scrolls with the page.

#### Scenario: Known active event renders on Current run

- **WHEN** a signed-in user opens `/legendary-events/astarLysander` while Lysander is active
- **THEN** the page title is Lysander's localized name, the lifecycle badge reads Active, the strip reads Overview, Teams, Plan, Current run, Current run is selected, and Run status and the progress grids of all three lanes render in it

#### Scenario: Upcoming and archived events open on Overview

- **WHEN** a user opens an upcoming event's page, or an archived one's
- **THEN** Overview is selected and the run tab reads "Next run", or "Last run"

#### Scenario: Unknown event id

- **WHEN** a user opens `/legendary-events/notAnEvent`
- **THEN** the route is replaced with `/legendary-events` and the hub renders

#### Scenario: Plan tab order

- **WHEN** the user selects Plan with only Beta shown on the other tabs
- **THEN** the page shows no lane selection, the Run forecast, the Token plan, Alpha's, Beta's and Gamma's Upgrade impact, then one "Battles" section with its lane dropdown

#### Scenario: Shown lanes carry over between tabs and visits

- **GIVEN** the user switched Beta off on desktop
- **WHEN** they select Teams, then reload the page
- **THEN** the Event board and, after the reload, the run tab's progress grids show Alpha and Gamma only

#### Scenario: Mobile shows one lane at a time

- **WHEN** the page renders below 768px
- **THEN** each lane block shows one lane, picked with Alpha, Beta, Gamma, and picking Beta shows Beta's blocks on every tab

#### Scenario: Mobile keeps the strip in reach

- **WHEN** the page renders below 768px and the user scrolls to the bottom of Beta's progress grid
- **THEN** the tab strip is still visible under the app header and tapping Plan switches the content without scrolling back up

#### Scenario: Tab resets per event

- **GIVEN** the user selected Plan on Lysander's page
- **WHEN** they open the page of Uthar, which is upcoming
- **THEN** Overview is selected

#### Scenario: Selected tab survives a reload

- **GIVEN** the user selected Plan, so the URL is `/legendary-events/astarLysander?tab=plan`
- **WHEN** they reload the page
- **THEN** Plan is selected

#### Scenario: A lane link from before the Teams tab

- **WHEN** a user opens `/legendary-events/astarLysander?tab=gamma` below 768px
- **THEN** Teams is selected with Gamma picked and the URL is replaced with `?tab=teams`

#### Scenario: Unknown tab value falls back to the default

- **WHEN** a user opens `/legendary-events/astarLysander?tab=delta` while Lysander is active
- **THEN** Current run is selected and the URL is replaced with `/legendary-events/astarLysander`

#### Scenario: Switching tabs adds no history entry

- **GIVEN** the user arrived at Lysander's page from `/legendary-events`
- **WHEN** they select Teams, then Plan, then press Back
- **THEN** the hub renders

### Requirement: Run status is read from the synced progress chunk

The Run status section SHALL show, from the synced `lre-progress` entry whose `id` equals the event id: "Event N of 3" from `currentEventRun` (omitted when null); tokens `current/max` with "next token in …", counted down from the instant the chunk was observed plus `nextTokenInSeconds` and read as "next token ready" once that instant has passed (omitted when the bucket is null or full); `currentPoints`; `currentCurrency`, labelled as currency in hand ("120 currency in hand"); claimed chests as `currentClaimedChestIndex` (the Tacticus API sends a 1-based count of chests opened, and -1 when it omits the field, which reads as 0); `currentShards`; and the next points milestone: the first entry of the event's own `rewards.pointsMilestones` (from its `lres` record) whose `cumulativePoints` exceeds `currentPoints`, as "N points to milestone M (+E currency)", or "—" when no such entry exists or the event's record is unavailable. It SHALL show the run timing from the lifecycle and "Synced X ago" from the player-data manifest `syncedAt` (hidden while that read is pending, "Not synced yet" before the first sync). It SHALL NOT offer its own sync control. It SHALL carry the Inputs button (see `legendary-event-run-inputs`) and the Reward outlook (see `legendary-event-reward-projection`). When the chunk has no entry for the event it SHALL show a "no synced progress for this event yet" body, the run timing, the Inputs button and the outlook computed from zero.

Assumptions:

- Each event carries its own reward ladder in `rewards`; ladders may differ between events. `pointsMilestones` is ordered by `cumulativePoints` ascending.
- Tokens and regeneration come from the sync, never computed locally.

#### Scenario: Populated run status

- **GIVEN** Lysander's synced entry has `currentEventRun` 1, tokens `{ current: 3, max: 12, nextTokenInSeconds: 5400 }`, `currentPoints` 3410, `currentCurrency` 120, `currentClaimedChestIndex` 4, `currentShards` 125, and the first milestone above 3,410 in Lysander's `rewards.pointsMilestones` is `{ milestone: 14, cumulativePoints: 3500, engramPayout: 60 }`
- **WHEN** the section renders
- **AND** the chunk was observed at the current instant
- **THEN** it shows "Event 1 of 3", "3/12 tokens, next in 1 hr 30 min", "3,410 points", "120 currency in hand", "4 chests claimed", "125 shards", and "90 points to milestone 14 (+60 currency)"

#### Scenario: Next-token countdown advances between syncs

- **GIVEN** the same entry, observed 2 hours before the current instant
- **WHEN** the section renders
- **THEN** it shows "3/12 tokens, next token ready"

#### Scenario: Event not in the synced chunk

- **GIVEN** the synced `lre-progress` array has no entry for `votanUthar`
- **WHEN** Uthar's run status renders
- **THEN** it shows the run timing, the "no synced progress for this event yet" body, the Inputs button and the outlook with a "No synced progress yet" note

#### Scenario: Last-synced age

- **GIVEN** the player-data manifest `syncedAt` is 25 minutes before now
- **WHEN** the section renders
- **THEN** it shows "Synced 25 minutes ago" and no sync button inside the section

#### Scenario: Ladder is per event

- **GIVEN** Uthar's ladder has 54 chests and Lysander's 60
- **WHEN** each event's run status renders
- **THEN** each card's milestone line and outlook read that event's own ladder

### Requirement: Objective labels and icons are derived from the catalog filter

An objective's display label SHALL be built from its catalog filter `{ kind, target, exclude }`, not from the catalog's English `name`: `Trait` → the `traits` entry for `target`; `DamageType` → the `damageTypes` entry; `Faction` → the `factions` entry; `Alliance` → the `common:alliances` entry; `MinHits` / `MaxHits` → the `legendaryEvents` templates "Min {{n}} hits" / "Max {{n}} hits"; `AttackType` → "Ranged", and with `exclude` "Melee"; any other `exclude: true` label is the template "No {{label}}". When a namespace lacks the target the catalog `name` is the fallback. Each objective SHALL carry its icon (`legendary-event-synced-progress`).

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

Each Event board lane column SHALL show, under the lane's label with the allowed-alliance rule derived from `allowedUnitsFilter` (for example "Alpha · No Xenos"), its kill points per battle, the battle count and the roster potential mini map (`legendary-event-roster-potential`, spanning the column's width) in place of a per-battle points ladder; the battle count SHALL be a link that opens Plan with that lane's Battles picked, scrolled into view; the lane's objectives with their scores are the column's unit-table headings. A collapsed "how points work" disclosure under the board SHALL explain kill points, objective scores, defeat-all and high-score points in one paragraph. Each battle's points SHALL remain available through the map column's label and tooltip.

#### Scenario: Lane column figures

- **WHEN** Lysander's Event board renders
- **THEN** the Alpha column shows "Alpha · No Xenos", "32 kill points per battle", "18 battles", an 18-column roster potential map whose first column is labelled "Battle 1 · 32 points" and last "Battle 18 · 57 points", and five objective headings (Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40); the disclosure under the board is collapsed

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

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, on Overview the tab strip and the lane summary; on Teams the Event board, the first shown lane's Teams section (which holds its Add team button) and the Eligibility leaderboard (cross-lane, or the lane's own with one lane shown); on Plan the Token plan header, the Upgrade impact header (see `legendary-event-upgrade-impact`) and the Battles section heading; and on the run tab the Next token card, the Run status card, its Run inputs button, the progress grid and the Last run card when it renders (see `legendary-event-run-history`); the same steps on desktop and mobile. Each step SHALL first open its tab, so stepping back across tabs shows the right one. The Next token step SHALL target the card in whichever state it renders (token or empty state). Every step's tooltip SHALL lie fully inside the viewport when it shows; a tall target such as an expanded Token plan is highlighted by its header, not its whole list. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip and the lane summary, then the Event board, the first Teams section and the Eligibility leaderboard, then the Token plan header, the Upgrade impact header and the Battles heading, then the Next token card, Run status, Run inputs, the progress grid and Last run (when the card renders), each on its tab and visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and each step follows the switch to its tab, each target scrolled into view

#### Scenario: Token plan step with a long plan

- **GIVEN** the Token plan is expanded with 24 tokens on a 1280 by 784 viewport
- **WHEN** the tour reaches the Token plan step
- **THEN** the Token plan header is highlighted, the tooltip's title, text and buttons are all inside the viewport, and the step does not scroll the list out of view

#### Scenario: Battles step

- **WHEN** the event page tour reaches the step after the Upgrade impact header
- **THEN** it stays on Plan and highlights the first shown lane's Battles section heading on desktop and mobile, then continues on the run tab

### Requirement: The Overview tab summarises the event

The Overview tab SHALL show, in order, a **lane summary** with one row per lane (Alpha, Beta, Gamma) carrying the lane's earned points of its maximum as text and a bar, the count of fully cleared battles of the lane's battle count ("N / M battles fully cleared", a battle counting when all six of its cells are cleared), and an **objectives line** with one indicator per lane objective in the lane's objective order (the objective's icon, "cleared / battles" where cleared is the number of the lane's battles whose synced progress has that objective cleared, and a bar in the same accent colour as the lane bar); then the plan notes when the plan is available. Activating a lane summary row SHALL select the run tab with that lane shown (added to the shown lanes on desktop, picked on mobile) and scroll the page so that lane's Synced progress grid is at the top of the viewport (below the sticky strip on mobile). When the synced progress read failed the lane summary SHALL show "synced data unavailable" in place of the figures and the objectives line; when the event has no synced entry it SHALL show 0 of the maximum for each lane and 0 of the battle count for each objective.

#### Scenario: Lane summary figures

- **GIVEN** Lysander's synced entry yields Alpha 3,410 of 9,000 earned with 7 of 18 battles fully cleared
- **WHEN** Overview renders
- **THEN** the Alpha row reads "3,410 / 9,000" with a bar at about 38% and "7 / 18 battles fully cleared"

#### Scenario: Lane summary objective counts

- **GIVEN** Lysander Alpha has five objectives and the synced entry clears the first objective in 11 of 18 battles, the fourth in 7 and the fifth in 8
- **WHEN** Overview renders
- **THEN** the Alpha objectives line shows five indicators whose first reads "11 / 18" with a bar at about 61%, the fourth "7 / 18" and the fifth "8 / 18", each headed by the objective's icon

#### Scenario: Lane summary jumps to the grid

- **WHEN** the user activates the Beta row
- **THEN** the run tab becomes selected with Beta shown and the Beta Synced progress grid heading is scrolled into view

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** Overview renders
- **THEN** each lane row shows "synced data unavailable", no objectives line, and remains activatable

#### Scenario: No synced entry

- **GIVEN** the event has no synced entry, or a lane has no synced record
- **WHEN** Overview renders
- **THEN** that lane's objectives line reads "0 / 18" for every objective

#### Scenario: Run tab and Plan order with a plan

- **GIVEN** an active event with teams that have depths
- **WHEN** the page opens
- **THEN** Current run shows, top to bottom, the Next token card with the tokens up next, Run status and the progress grids, and Plan shows the Run forecast (collapsed), then the Token plan (open)

### Requirement: Home links target the Legendary Events section

The Home events widget's Legendary Event rows SHALL link to `/legendary-events/:eventId` and its "open Legendary Events" link to `/legendary-events`.

#### Scenario: Home row link

- **GIVEN** Lysander is active
- **WHEN** the Home events widget renders
- **THEN** Lysander's row links to `/legendary-events/astarLysander`

### Requirement: A hub row lists every run's date of an unfinished event

A row of an active or upcoming event SHALL list runs 1 to 3 with their start dates: the announced date, or the guessed start (`legendary-event-run-date-estimate`) as "maybe ~<month year>", or "date unknown" when there is no guess. An archived row SHALL list none.

#### Scenario: Upcoming event with one announced run

- **GIVEN** Bile is upcoming with run 1 announced for 8 November 2026 and no other run announced
- **WHEN** the hub renders in English
- **THEN** Bile's row lists "Run 1: Nov 8, 2026", "Run 2: maybe ~May 2027" and "Run 3: maybe ~Oct 2027"

### Requirement: The Teams tab shows an Event board of the shown lanes

The Teams tab SHALL show, after the lane selection, an Event board laid out like V1's Teams tab: one column per shown lane in lane order, side by side at or above 1024px and stacked below. Each column SHALL show its name with its allowed-units rule and its overview figures (see "Lane overview section"), a unit table, then the lane's Teams section with its team cards, Add team and Suggest teams (see `legendary-event-teams`), so a lane's teams are edited in place. The unit table SHALL have one column per objective in objective order, headed by its icon, label, points and "cleared / battles" from synced progress (omitted while progress is unavailable), listing every unit the lane allows that satisfies it: owned units first by power, strongest first, then units the player does not own, marked "Locked"; a dashed line SHALL follow the fifth unit. Pressing objective headings SHALL select them: the selected objectives merge into one leading column listing the units that satisfy all of them, until the selection is cleared. Every owned unit's chip SHALL show its portrait ringed in its rarity colour, its rank icon and its active and passive ability levels on a background in its rank colour; a team card's member chips SHALL be the same chips with its stars. Once teams have loaded, an objective no saved team covers SHALL be marked "No team". Activating a unit SHALL open the page's team editor on a new team starting with that unit and the column's objectives.

Under the board the tab SHALL show one **Eligibility leaderboard** (specified in `legendary-event-eligibility`): the cross-lane leaderboard over the shown lanes when two or three are shown, and the lane's own leaderboard (with its objective icons and estimated clears) when one is.

#### Scenario: Board shows the shown lanes

- **GIVEN** Alpha and Beta each have one saved team and all three lanes are shown
- **WHEN** the user opens the Teams tab
- **THEN** the Event board shows three lane columns with their figures and objectives, one team card in Alpha and in Beta, Gamma's empty state, and the cross-lane leaderboard under the board

#### Scenario: Uncovered objective

- **GIVEN** no saved Alpha team covers Alpha's second objective
- **WHEN** the Event board renders
- **THEN** that objective is marked "No team"

#### Scenario: Objective selection

- **GIVEN** the user presses Alpha's first and second objective headings
- **WHEN** the table renders
- **THEN** its first column lists only the units satisfying both, and Clear selection restores one column per objective

#### Scenario: One lane shown

- **GIVEN** the user switches Alpha and Gamma off
- **WHEN** the Teams tab renders, now or after a reload
- **THEN** only Beta's column shows, the leaderboard is Beta's own, and Beta's switch cannot be turned off
