# legendary-event-master-table Specification

## Purpose

Defines the Legendary Events master table: every unit's points across the selected events, its unit sets and points modes, URL state, the desktop table and mobile cards, data states, tour and analytics.

## Requirements

### Requirement: The master table ranks units across selected events

`/legendary-events/master-table` SHALL show one row per unit that at least one lane of a selected event allows, with one cell per selected event and a total. A cell SHALL show the unit's points for that event in the current points mode and, in the All and Unlocked unit sets, its objectives count (the sum over the event's lanes of the objectives the unit satisfies); in the In teams unit set it SHALL show the number of distinct teams of the event's plan holding the unit (as member or reserve) and those teams' lanes. A lane that does not allow the unit SHALL contribute nothing. The row total SHALL be the sum of its cells. Rows SHALL be ordered by the sort key descending (the total by default, or one selected event's points), then by total, then by localized unit name. All figures SHALL be in event points and anchored to the unit's current synced progression.

Assumptions:

- A lane's points per battle for a unit are the lane's kill points (defeat-all) plus the scores of the bonus objectives the unit satisfies, each awarded once per battle (Stage 1 rule).
- Every lane has the catalog battle count (18 for every served event today).
- Objective matching reads only static unit data, so a unit's satisfied objectives do not depend on its rank or stars.

#### Scenario: Worked example, All mode, Dante across Lysander and Uthar

- **GIVEN** events Lysander and Uthar are selected, points mode All, unit set All, and `bloodDante` (Imperial; traits Flying, Rapid Assault, no Resilient; melee Piercing 4 hits; active ability damage Melta; no ranged attack)
- **AND** Lysander Alpha (kill points 32; Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 Hits 85, No Resilient 40), Lysander Beta (No Imperials), Lysander Gamma (kill points 31; No Bolter 40, Healer 100, Min 3 Hits 60, Plasma 95, Rapid Assault 80)
- **AND** Uthar Alpha (kill points 34; Ultramarines 75, Resilient 95, Max 2 Hits 50, Melee 65, Piercing 90), Uthar Beta (No Imperials), Uthar Gamma (kill points 17; No Power 50, Bolter 85, Mechanical 100, Max 1 Hit 75, Big Target 65), 18 battles per lane
- **WHEN** the table renders
- **THEN** Lysander: Alpha 32 + 80 + 40 = 152 per battle × 18 = 2,736 (2 objectives); Beta 0; Gamma 31 + 40 + 60 + 80 = 211 × 18 = 3,798 (3 objectives); cell 6,534 points, 5 objectives
- **AND** Uthar: Alpha 34 + 65 + 90 = 189 × 18 = 3,402 (2 objectives); Beta 0; Gamma 17 + 50 = 67 × 18 = 1,206 (1 objective); cell 4,608 points, 3 objectives
- **AND** Dante's total is 6,534 + 4,608 = 11,142

#### Scenario: Sort by one event

- **GIVEN** the same table and the user sorts by Uthar
- **WHEN** the rows reorder
- **THEN** they are ordered by the Uthar cell's points descending, ties broken by total then name, and the sort is reflected in the URL as `sort=votanUthar`

### Requirement: Points modes

The page SHALL offer three points modes, shared by every cell: **Remaining** (default), **All** and **Estimated**, each with a one-line explanation in a "How points work" disclosure.

- **All**: per lane, points per battle × battle count.
- **Remaining**: per lane, for every battle, the defeat-all points unless synced objective id 0 is cleared in that battle, plus each considered objective's score unless that objective is cleared in that battle (the Stage 1 remaining-points rule). Without a synced entry for the event nothing is cleared, so Remaining equals All.
- **Estimated**: Remaining restricted to battles 1..d of each lane, where d is, in the In teams unit set, the deepest effective depth (the current run's stored depth, else the team estimate) among the unit's teams on that lane, and otherwise the unit's Stage 5 per-unit clear estimate on that lane. A lane with no depth (unit not owned, or no estimate) SHALL contribute 0.

Assumptions:

- Synced `objectivesCleared` is the source of what is cleared; id 0 is defeat-all and id k is the objective with catalog index k − 1.
- The per-unit clear estimate is a team of five like the unit, scaled by its horde-mode tier and the calibrated power ratio (Stage 5), anchored to current progression.

#### Scenario: Worked example, Remaining

- **GIVEN** the Dante example, Remaining mode, and synced Lysander Alpha battles 1–5 with every objective cleared and nothing cleared elsewhere
- **WHEN** the table renders
- **THEN** Lysander Alpha is 152 × 13 = 1,976, Lysander's cell is 1,976 + 3,798 = 5,774, Uthar's is 4,608, and the total is 10,382

#### Scenario: Worked example, Estimated

- **GIVEN** the same progress and Dante's Stage 5 estimates of 7 battles on Lysander Alpha, 4 on Lysander Gamma, 6 on Uthar Alpha and 9 on Uthar Gamma
- **WHEN** Estimated is chosen
- **THEN** Lysander Alpha counts battles 6–7 only, 152 × 2 = 304; Lysander Gamma 211 × 4 = 844; Lysander's cell is 1,148
- **AND** Uthar Alpha is 189 × 6 = 1,134, Uthar Gamma 67 × 9 = 603, Uthar's cell 1,737, and the total 2,885

#### Scenario: Estimated for a locked unit

- **GIVEN** a unit the synced roster does not own
- **WHEN** Estimated is chosen
- **THEN** every cell of its row shows 0 and the row stays listed in the All unit set

#### Scenario: Estimated while estimates are unavailable

- **GIVEN** the clear-estimate configuration or a selected event's battle powers failed to load
- **WHEN** the controls render
- **THEN** Estimated is disabled with "Needs clear estimates", and a URL with `points=estimated` shows Remaining with that note

### Requirement: Unit sets

The page SHALL offer three unit sets: **All** (every allowed unit), **Unlocked** (units the synced roster owns) and **In teams** (units with at least one team in a selected event's plan). In In teams, a unit's points on a lane SHALL count defeat-all plus only the objectives its teams on that lane cover and it satisfies: the union over its non-reserve memberships of each team's stored covered objectives that its current members still derive. A unit that is only a reserve on a lane SHALL count defeat-all there and no objectives. The default unit set SHALL be In teams when any plan of the selected events has a team, otherwise All; the default SHALL be re-derived when the selected events change only while the user has not picked a unit set.

#### Scenario: Worked example, In teams

- **GIVEN** Lysander is the only selected event, mode All, and Lysander's plan has Gamma team "Assault" with Dante as a member and stored objectives Min 3 Hits and Rapid Assault (both still derived), and no Alpha team holding Dante
- **WHEN** the unit set is In teams
- **THEN** Dante's row is listed with Lysander's cell showing 1 team (Gamma) and (31 + 60 + 80) × 18 = 3,078 points; Alpha contributes nothing because no Alpha team holds him

#### Scenario: Default follows the plans

- **GIVEN** no plan of the selected events has a team
- **WHEN** the page opens without `units` in the URL
- **THEN** the unit set is All; after the user adds Uthar, whose plan has a team, it becomes In teams

#### Scenario: Unlocked needs a roster

- **GIVEN** the roster could not be read
- **WHEN** the controls render
- **THEN** Unlocked is disabled with "Sync your roster" and the other sets work

### Requirement: Event selection and URL state

The event picker SHALL list every catalog Legendary Event in hub order: active and upcoming events first, then, below a divider, archived events. The default selection SHALL be every active and upcoming event. The selected events, unit set, points mode, sort and name search SHALL be kept in the URL query (`events`, `units`, `points`, `sort`, `q`); a missing or invalid value SHALL fall back to its default and an unknown event id SHALL be dropped. The state SHALL NOT be shared with the event pages and SHALL NOT be stored outside the URL. A name search SHALL keep rows whose localized unit name contains the query, case-insensitively.

#### Scenario: Default selection

- **GIVEN** Uthar active, Farsight and Lysander upcoming, and Fabius Bile upcoming
- **WHEN** the page opens without query parameters
- **THEN** all four are selected, and any archived event the catalog serves is listed unselected below the divider

#### Scenario: Shared link restores the view

- **WHEN** the user opens `/legendary-events/master-table?events=tauFarsight,votanUthar&units=unlocked&points=all&sort=tauFarsight`
- **THEN** Farsight and Uthar are selected, Unlocked and All are active, and rows are sorted by Farsight

#### Scenario: No event selected

- **WHEN** the user unticks every event
- **THEN** the table is replaced by "Pick at least one event"

#### Scenario: Nothing matches

- **WHEN** the search and unit set leave no row
- **THEN** "No unit matches" shows with a Clear search action

### Requirement: Desktop and mobile layouts

The master table SHALL use no data grid and no persisted column layout.

#### Scenario: Desktop layout

- **WHEN** the page renders at or above 768px
- **THEN** a controls row (event picker, unit set, points mode, search) sits above a table whose first column (portrait, name, rarity and rank) stays visible while the table scrolls horizontally inside its container; a Total group follows, then one group per selected event headed by the event unit's portrait and name; clicking an event header sorts by that event and clicking Total restores the default; the page itself never scrolls horizontally

#### Scenario: Mobile layout

- **WHEN** the page renders below 768px
- **THEN** a compact bar holds the search and a Controls button that opens a bottom sheet with the event picker, unit set, points mode and a Sort by select; each unit is a card with portrait, name, rarity and rank and total, and one line per selected event such as "Lysander · 5,774 · 5 objectives" (In teams: "Lysander · 1 team · Gamma"); nothing scrolls horizontally

### Requirement: Master table data states are distinct

The page SHALL distinguish: catalog loading (skeleton rows) and catalog failed (error with Retry); plans loading (team figures and In teams show a spinner) and plans failed (In teams disabled with "Teams unavailable", team counts hidden, other modes work); synced progress failed (Remaining equals All, labelled "no synced progress"); roster unknown (Unlocked and Estimated disabled). An archived event with no synced entry SHALL show Remaining equal to All.

#### Scenario: Plans failed

- **GIVEN** the plan list read fails
- **WHEN** the page renders
- **THEN** the All and Unlocked sets render normally, In teams is disabled with "Teams unavailable", and no team count is shown

#### Scenario: Synced progress failed

- **GIVEN** the player-data read fails
- **WHEN** Remaining is shown
- **THEN** every cell equals its All value and the mode is labelled "no synced progress"

### Requirement: Master table tour and analytics

The page SHALL have a Joyride tour targeting, in order, the controls (on mobile the Controls button), the event picker, the points mode and the first row, with the same steps on desktop and mobile and localized copy in en/de/es/fr. The page SHALL record `legendary_event_master_table_viewed` (eventCount, unitSet, pointsMode) once per visit and `legendary_event_master_table_changed` (control `events` | `unitSet` | `pointsMode` | `sort`, with the new value or eventCount) on each control change.

#### Scenario: Tour on mobile

- **WHEN** the tour starts below 768px
- **THEN** the first step highlights the Controls button, later steps target the picker and points mode inside the opened sheet in order, and the last step targets the first unit card

#### Scenario: Tour on desktop

- **WHEN** the tour starts at or above 768px
- **THEN** the steps highlight the controls row, the event picker, the points mode control and the first table row, each visible when its step shows
