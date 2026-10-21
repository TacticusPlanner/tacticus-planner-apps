# Spec Delta

## MODIFIED Requirements

### Requirement: The previous run is chosen from the event's run records

The event page SHALL read the first page of the event's run records (newest first, the server's default page size) and classify them. When the event is active and the newest record's `run` equals the synced `currentEventRun`, the newest record SHALL be the **current** run, the next the **previous** run, and the rest **earlier** runs. Otherwise (the event is upcoming or archived, or no record exists yet for the current run) there SHALL be no current record, the newest SHALL be the previous run and the rest earlier runs. Records beyond the first page SHALL be read only when the user asks for more earlier runs. Records SHALL be read-only and SHALL NOT carry the roster; the roster is read separately (see "Roster changes since the previous run").

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

#### Scenario: One page is read on load

- **GIVEN** Farsight is archived with 30 records
- **WHEN** the page loads
- **THEN** one run-records request is issued, the previous run and the earlier runs of that page are classified, and no further page is requested until the user asks for more

### Requirement: Roster changes since the previous run

For the distinct members and reserves of the previous record's teams, the system SHALL read that record's roster on demand — once, when the Last run card (or an expanded Earlier runs entry) is shown — and compare the unit in it with the current synced roster, listing per unit: **unlocked** when absent from the record and owned now; **stars** from → to when the current progression is later; **rank** from → to when the current rank is later (applied upgrades ignored); and each **ability** whose level rose, from → to. Units with no change, and units owned neither then nor now, SHALL be omitted. Values that went down SHALL be ignored. A record with no teams SHALL not have its roster read.

#### Scenario: Worked example, Calgar progressed

- **GIVEN** the record's roster has `ultraCalgar` at Diamond1, `Legendary:RedFiveStars`, active 40, passive 38, and the current roster has him at Diamond3, `Legendary:OneBlueStar`, active 45, passive 38
- **WHEN** roster changes are listed
- **THEN** Calgar shows rank Diamond 1 → Diamond 3, stars 5 red → 1 blue, and active ability 40 → 45, and no passive line

#### Scenario: Worked example, unlocked since

- **GIVEN** `ultraTigurius` is in a team of the record but absent from its roster, and owned now
- **WHEN** roster changes are listed
- **THEN** Tigurius shows "Unlocked since last run"

#### Scenario: Roster is read once per shown record

- **GIVEN** a previous run with teams
- **WHEN** the Last run card renders and the user later expands one earlier run
- **THEN** exactly one roster request is issued for each of the two records, and re-collapsing and re-expanding issues none

#### Scenario: No teams, no roster read

- **GIVEN** a previous run whose record has no teams
- **WHEN** the Last run card renders
- **THEN** no roster request is issued

### Requirement: Last run card on the Overview tab

The Overview tab SHALL show a **Last run** card for the previous run when one exists, after the Run status card. It SHALL show "Run N of 3", the local date of the record's last progress, the event points recorded, and per lane its cleared battle and points ("Alpha: battle 4 · 1,139 points"); the teams used per lane with portraits and "cleared up to battle N" (and their planned depth for that run when stored); and a **Since last run** list of roster changes. On an archived or upcoming event the card SHALL be followed by a collapsed **Earlier runs** list with one expandable entry per earlier record read so far, carrying the same content, and, when the last page read was full, a "Load more" control that reads the next page and appends its records; an active event SHALL show only the Last run card.

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

#### Scenario: Load more earlier runs

- **GIVEN** an archived event whose first page of records was full
- **WHEN** the user opens Earlier runs and activates Load more
- **THEN** one request reads the next page and its records are appended as further entries; when the returned page is not full, Load more is no longer shown

### Requirement: Run history data states are distinct

The history SHALL distinguish: records loading (card skeleton); records read failed ("History unavailable" with Retry, the rest of the page unaffected); no record at all for the event (a one-line "History starts with your next synced run" note in the card's place); an active event whose only record is the current run (no card and no note); a previous record with no teams ("No teams were planned for this run" and no Since last run list); a record whose roster is still loading (the Since last run list shows a skeleton while the rest of the card renders); a record whose roster read failed (the Since last run list replaced by "Roster at the time is unavailable" with Retry); and a current roster that cannot be read (the Since last run list replaced by "Sync your roster to compare").

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

#### Scenario: Roster read failed

- **GIVEN** the previous run's record loaded but its roster read fails
- **WHEN** the Last run card renders
- **THEN** the lanes, points and teams render, and the Since last run list is replaced by "Roster at the time is unavailable" with a Retry that re-reads only the roster
