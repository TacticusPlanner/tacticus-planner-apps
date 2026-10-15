# Spec Delta

## MODIFIED Requirements

### Requirement: The Overview tab summarises the event

The Overview tab SHALL show, in order: the **Next token** card (see `legendary-event-token-plan`); the Run status card (unchanged from its requirement); the collapsible **Token plan** (see `legendary-event-token-plan`); the collapsible **Run forecast** (see `legendary-event-run-forecast`); a **lane summary** with one row per lane (Alpha, Beta, Gamma) carrying the lane's earned points of its maximum as text and a bar, the count of fully cleared battles of the lane's battle count, and an **objectives line** with one indicator per lane objective in the lane's objective order (the objective's icon, "cleared / battles" where cleared is the number of the lane's battles whose synced progress has that objective cleared, and a bar in the same accent colour as the lane bar); and the cross-lane Eligibility leaderboard (specified in `legendary-event-eligibility`). Activating a lane summary row SHALL select that lane's tab and scroll the page so that lane's Synced progress grid is at the top of the viewport (below the sticky strip on mobile). When the synced progress read failed the lane summary SHALL show "synced data unavailable" in place of the figures and the objectives line; when the event has no synced entry it SHALL show 0 of the maximum for each lane and 0 of the battle count for each objective.

#### Scenario: Lane summary figures

- **GIVEN** Lysander's synced entry yields Alpha 3,410 of 9,000 earned with 7 of 18 battles fully cleared
- **WHEN** Overview renders
- **THEN** the Alpha row reads "3,410 / 9,000" with a bar at about 38% and "7 / 18 battles"

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

The hub SHALL have a page tour with steps for the Active group (or the no-event line) and one upcoming row, on desktop and mobile. The event page SHALL have a page tour that targets, in order, the tab strip, the Next token card, the Run status card, its Run inputs button, the Token plan header, the Overview lane summary and the cross-lane leaderboard, then (after switching to Alpha) the lane overview, the Teams section (which holds its Add team button), the progress grid and the leaderboard; the same steps on desktop and mobile. The Next token step SHALL target the card in whichever state it renders (token or empty state). Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Event page tour on desktop

- **WHEN** the page tour starts on `/legendary-events/astarLysander` at or above 768px
- **THEN** steps highlight the tab strip, the Next token card, Run status, Run inputs, the Token plan header, the lane summary and the cross-lane leaderboard, then Alpha's lane overview, Teams section, progress grid and leaderboard, each target visible when its step shows

#### Scenario: Event page tour on mobile

- **WHEN** the page tour starts below 768px
- **THEN** the same steps run in the same order; the strip step targets the sticky strip and the lane steps follow the switch to Alpha, each target scrolled into view
