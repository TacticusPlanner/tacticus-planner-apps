# legendary-event-run-history Specification

## Purpose

Defines run history on a Legendary Event page: how the previous run is chosen from the event's run records, the figures derived from a record, roster changes since that run, the Last run card, its data states, tour step and analytics.

## Requirements

### Requirement: The previous run is chosen from the event's run records

The event page SHALL read the event's run records (newest first) and classify them. When the event is active and the newest record's `run` equals the synced `currentEventRun`, the newest record SHALL be the **current** run, the next the **previous** run, and the rest **earlier** runs. Otherwise (the event is upcoming or archived, or no record exists yet for the current run) there SHALL be no current record, the newest SHALL be the previous run and the rest earlier runs. Records SHALL be read-only.

Assumptions:

- A record holds the state as of the last sync that changed that run's progress; runs played entirely between two syncs have no record.
- `currentEventRun` is the synced run (1–3) of the current occurrence.

#### Scenario: Active event in its second run

- **GIVEN** Uthar is active with synced `currentEventRun` 2, and records for run 2 (started 2026-10-11) and run 1 (started 2026-10-04)
- **WHEN** the event page loads
- **THEN** run 2 is current, run 1 is the previous run, and there are no earlier runs

#### Scenario: Active event before its first sync of the run

- **GIVEN** Uthar is active with `currentEventRun` 3 and only records for runs 2 and 1
- **WHEN** the page loads
- **THEN** run 2 is the previous run and run 1 is an earlier run

#### Scenario: Event that is not active

- **GIVEN** Farsight is upcoming with records for runs 3, 2 and 1
- **WHEN** the page loads
- **THEN** run 3 is the previous run and runs 2 and 1 are earlier runs

### Requirement: Run history figures are derived from the record

For a record and a lane, the system SHALL derive: the **lane cleared battle**, the highest 1-based battle whose encounter has defeat-all (id 0) in `objectivesCleared`, or 0; the **lane points**, the sum over its encounters of the high score counted twice (the record stores only the high score, which the game reports equal to the kill score, so it stands for both awards), plus the battle's defeat-all score when id 0 is cleared, plus the catalog score of each cleared bonus objective (the synced-progress earned-points rule, with the current catalog lane); and, for each team in the record's teams snapshot on that lane, the **team cleared battle**, the highest battle whose encounter clears defeat-all and every objective id `index + 1` of the team's snapshot `objectiveIndexes` (a team with no objectives uses the lane cleared battle). The team figure is inferred from shared lane progress and SHALL be labelled "cleared up to". A lane whose stored encounter count exceeds the current catalog lane's battle count SHALL show its cleared battle but no points.

Assumptions:

- Objective id 0 is defeat-all and id k is the objective with catalog index k − 1 (synced-progress contract).
- The game does not report which team cleared which objective, so a team's figure is the deepest battle where everything it covers was cleared by anyone.
- A record keeps no separate kill score; the kill score is taken as the stored high score, as in every synced encounter observed.

#### Scenario: Worked example, Uthar Alpha run 1

- **GIVEN** a run 1 record whose Alpha encounters are battle 1 `[0,1,2,3,4,5]` high score 29, battle 2 `[0,1,4,5]` high score 31, battle 3 `[0,4]` high score 35, battle 4 `[0,1]` high score 30, battle 5 `[]` high score 12
- **AND** Uthar Alpha's defeat-all is 30 per battle and its objectives are Ultramarines 75 (index 0), Resilient 95 (1), Max 2 Hits 50 (2), Melee 65 (3), Piercing 90 (4)
- **WHEN** the lane figures are derived
- **THEN** the lane cleared battle is 4
- **AND** the lane points are battle 1: 29 + 29 + 30 + 375 = 463; battle 2: 31 + 31 + 30 + 75 + 65 + 90 = 322; battle 3: 35 + 35 + 30 + 65 = 165; battle 4: 30 + 30 + 30 + 75 = 165; battle 5: 12 + 12 = 24; total 1,139

#### Scenario: Worked example, team cleared battles

- **GIVEN** the same record's teams snapshot holds Alpha teams "Ultras" (objectives `[0,3]`, ids 1 and 4) and "Melee" (objectives `[3]`, id 4)
- **WHEN** the team figures are derived
- **THEN** Ultras cleared up to battle 2 (battle 3 lacks id 1) and Melee cleared up to battle 3 (battle 4 lacks id 4)

### Requirement: Roster changes since the previous run

For the distinct members and reserves of the previous record's teams, the system SHALL compare the unit in the record's roster snapshot with the current synced roster and list per unit: **unlocked** when absent from the record and owned now; **stars** from → to when the current progression is later; **rank** from → to when the current rank is later (applied upgrades ignored); and each **ability** whose level rose, from → to. Units with no change, and units owned neither then nor now, SHALL be omitted. Values that went down SHALL be ignored.

#### Scenario: Worked example, Calgar progressed

- **GIVEN** the record's roster snapshot has `ultraCalgar` at Diamond1, `Legendary:RedFiveStars`, active 40, passive 38, and the current roster has him at Diamond3, `Legendary:OneBlueStar`, active 45, passive 38
- **WHEN** roster changes are listed
- **THEN** Calgar shows rank Diamond 1 → Diamond 3, stars 5 red → 1 blue, and active ability 40 → 45, and no passive line

#### Scenario: Worked example, unlocked since

- **GIVEN** `ultraTigurius` is in a team of the record but absent from its roster snapshot, and owned now
- **WHEN** roster changes are listed
- **THEN** Tigurius shows "Unlocked since last run"

### Requirement: Last run card on the Overview tab

The Overview tab SHALL show a **Last run** card for the previous run when one exists, after the Run status card. It SHALL show "Run N of 3", the local date of the record's last progress, the event points recorded, and per lane its cleared battle and points ("Alpha: battle 4 · 1,139 points"); the teams used per lane with portraits and "cleared up to battle N" (and their planned depth for that run when stored); and a **Since last run** list of roster changes. On an archived or upcoming event the card SHALL be followed by a collapsed **Earlier runs** list with one expandable entry per earlier record carrying the same content; an active event SHALL show only the Last run card.

#### Scenario: Desktop card

- **WHEN** the Overview renders at or above 768px with a previous run
- **THEN** the card shows the three lanes side by side, each with its cleared battle, points and teams, and the Since last run list below them

#### Scenario: Mobile card

- **WHEN** the Overview renders below 768px with a previous run
- **THEN** the card stacks the lanes, each lane's teams collapse behind a "Teams (N)" toggle, and the Since last run list follows; nothing scrolls horizontally

#### Scenario: Teams with a planned depth

- **GIVEN** the record's "Ultras" team has `expectedBattleClears` 6 for that run
- **WHEN** the card renders
- **THEN** the team row reads "cleared up to battle 2 · planned 6"

### Requirement: Run history data states are distinct

The history SHALL distinguish: records loading (card skeleton); records read failed ("History unavailable" with Retry, the rest of the page unaffected); no record at all for the event (a one-line "History starts with your next synced run" note in the card's place); an active event whose only record is the current run (no card and no note); a previous record with no teams ("No teams were planned for this run" and no Since last run list); a record with no roster snapshot (the Since last run list replaced by "Roster at the time is unavailable"); and a roster that cannot be read (the Since last run list replaced by "Sync your roster to compare").

#### Scenario: First recorded run

- **GIVEN** Uthar is active in run 1 and its only record is run 1
- **WHEN** the Overview renders
- **THEN** no Last run card and no history note is shown

#### Scenario: No records

- **GIVEN** Lysander has no records
- **WHEN** the Overview renders
- **THEN** "History starts with your next synced run" shows where the card would be

#### Scenario: Read failed

- **GIVEN** the run-records read fails
- **WHEN** the Overview renders
- **THEN** the card area shows "History unavailable" with Retry and every other Overview section renders normally

### Requirement: Run history tour step and analytics

When the Last run card renders, the event page tour SHALL include a Last run step after the Run status step, targeting `data-testid="legendary-event-last-run"` on both forms, with localized copy in en/de/es/fr; when the card does not render the step SHALL be skipped. The page SHALL record `legendary_event_last_run_viewed` (eventId, run, teamCount, deltaCount) once per page view when the card first becomes visible, and `legendary_event_earlier_runs_expanded` (eventId, recordCount) when Earlier runs is opened.

#### Scenario: Tour with a previous run

- **GIVEN** a previous run exists
- **WHEN** the event page tour runs on desktop or mobile
- **THEN** the step after Run status highlights the Last run card

#### Scenario: Tour without a previous run

- **GIVEN** no previous run exists
- **WHEN** the tour runs
- **THEN** it goes from Run status to the next existing step with no empty step
