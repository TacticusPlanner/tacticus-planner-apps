# Spec Delta

## MODIFIED Requirements

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

### Requirement: The Overview tab summarises the event

The Overview tab SHALL show, in order: the **Next token** card (see `legendary-event-token-plan`); the Run status card (unchanged from its requirement); the collapsible **Token plan** (see `legendary-event-token-plan`); the collapsible **Run forecast** (see `legendary-event-run-forecast`); a **lane summary** with one row per lane (Alpha, Beta, Gamma) carrying the lane's earned points of its maximum as text and a bar, the count of fully cleared battles of the lane's battle count ("N / M battles fully cleared", a battle counting when all six of its cells are cleared), and an **objectives line** with one indicator per lane objective in the lane's objective order (the objective's icon, "cleared / battles" where cleared is the number of the lane's battles whose synced progress has that objective cleared, and a bar in the same accent colour as the lane bar); and the cross-lane Eligibility leaderboard (specified in `legendary-event-eligibility`). Activating a lane summary row SHALL select that lane's tab and scroll the page so that lane's Synced progress grid is at the top of the viewport (below the sticky strip on mobile). When the synced progress read failed the lane summary SHALL show "synced data unavailable" in place of the figures and the objectives line; when the event has no synced entry it SHALL show 0 of the maximum for each lane and 0 of the battle count for each objective.

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
- **THEN** the Beta tab becomes selected and the Beta Synced progress grid heading is scrolled into view

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** Overview renders
- **THEN** each lane row shows "synced data unavailable", no objectives line, and remains activatable

#### Scenario: No synced entry

- **GIVEN** the event has no synced entry, or a lane has no synced record
- **WHEN** Overview renders
- **THEN** that lane's objectives line reads "0 / 18" for every objective

#### Scenario: Overview order with a plan

- **GIVEN** an active event with teams that have depths
- **WHEN** Overview renders
- **THEN** it shows, top to bottom, the Next token card, Run status, Token plan (collapsed), Run forecast (collapsed), the lane summary and the cross-lane leaderboard

### Requirement: The Events pages have Joyride tours

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, the tab strip, the Next token card, the Run status card, its Run inputs button, the Token plan header, the Overview lane summary and the cross-lane leaderboard, then (after switching to Alpha) the lane overview, the Teams section (which holds its Add team button), the progress grid and the leaderboard; the same steps on desktop and mobile. The Next token step SHALL target the card in whichever state it renders (token or empty state). Every step's tooltip SHALL lie fully inside the viewport when it shows; a tall target such as an expanded Token plan is highlighted by its header, not its whole list. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip, the Next token card, Run status, Run inputs, the Token plan header, the lane summary and the cross-lane leaderboard, then Alpha's lane overview, Teams section, progress grid and leaderboard, each target visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and the lane steps follow the switch to Alpha, each target scrolled into view

#### Scenario: Token plan step with a long plan

- **GIVEN** the Token plan is expanded with 24 tokens on a 1280 by 784 viewport
- **WHEN** the tour reaches the Token plan step
- **THEN** the Token plan header is highlighted, the tooltip's title, text and buttons are all inside the viewport, and the step does not scroll the list out of view
