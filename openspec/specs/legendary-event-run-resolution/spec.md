# legendary-event-run-resolution Specification

## Purpose

Defines how the planner decides which run of a Legendary Event is in progress, which runs have ended and which comes next, from the catalog's run schedule, the clock and the synced run number, and what it shows when the run cannot be known. Every run-dependent figure (token supply, depth, reward projection) reads this one resolution.

## Requirements

### Requirement: Runs are resolved from the run schedule and the clock

For each event the planner SHALL resolve `endedRuns` (0 to 3), the run in progress (while the event is active) and the next run (1 to 3, or none). Run `n`'s start is element `n − 1` of `eventStageStartDatesUtc`; a run has ended once its start plus 7 days has passed, and is in progress while the clock is inside that window. The next run is the first run that is neither ended nor in progress; when its start is not in the schedule it is announced as "to be announced".

#### Scenario: Between runs on Uthar

- **GIVEN** Uthar's schedule is `["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"]` and the clock is 2026-10-16, with the synced `currentEventRun` null
- **WHEN** the runs are resolved
- **THEN** `endedRuns` is 2, no run is in progress and the next run is 3 with no start date ("to be announced")

#### Scenario: Lysander after its first run

- **GIVEN** Lysander's schedule is `["2026-08-30T00:00:00Z"]` and the clock is 2026-10-16, with the synced `currentEventRun` null and a synced entry of 12,531 points
- **WHEN** the runs are resolved
- **THEN** `endedRuns` is 1 and the next run is 2, "to be announced"

#### Scenario: Before the first run

- **GIVEN** Fabius Bile's schedule is `["2026-11-08T00:00:00Z"]`, no synced entry, clock 2026-10-16
- **WHEN** the runs are resolved
- **THEN** `endedRuns` is 0 and the next run is 1, starting 2026-11-08

#### Scenario: Between two announced runs

- **GIVEN** a schedule of run 1 at 2026-10-04 and run 2 at 2026-10-18, clock 2026-10-14
- **WHEN** the runs are resolved
- **THEN** `endedRuns` is 1 and the next run is 2, starting 2026-10-18

#### Scenario: Every run has ended

- **GIVEN** a schedule of three run starts all more than 7 days ago and `finished` false
- **WHEN** the runs are resolved
- **THEN** `endedRuns` is 3 and there is no next run, so the event shows no token plan or forecast, as an archived event does

### Requirement: The synced run wins while a run is in progress

While the event is active, a numeric synced `currentEventRun` SHALL be the run in progress and `endedRuns` SHALL be that run minus 1, even when the schedule disagrees; when the synced run is null or absent, the run in progress is the schedule window that contains the clock. When the event is not active the synced run SHALL NOT be used, because the game sends none between runs.

#### Scenario: Synced run beats the schedule

- **GIVEN** Uthar is active, the schedule puts the clock in run 2's window and the synced `currentEventRun` is 3
- **WHEN** the runs are resolved
- **THEN** run 3 is in progress and `endedRuns` is 2

#### Scenario: Active without a synced run

- **GIVEN** Uthar is active inside run 2's window and the synced `currentEventRun` is null
- **WHEN** the runs are resolved
- **THEN** run 2 is in progress and `endedRuns` is 1

### Requirement: The run can be unknown

The run SHALL be unknown when the event is not finished, the account's synced entry shows progress (an encounter or points above 0), and the schedule shows no run ended or in progress (an empty schedule, or only future starts). In the unknown state the planner SHALL show no run number anywhere, and SHALL NOT assume runs 1 or 2 are over or upcoming.

#### Scenario: Event with progress and no schedule

- **GIVEN** an unfinished event with an empty schedule and a synced entry of 12,530 points
- **WHEN** the runs are resolved
- **THEN** the run is unknown

#### Scenario: Progress with only a future date

- **GIVEN** an unfinished event with a synced entry of 3,000 points and a schedule of one start in the future
- **WHEN** the runs are resolved
- **THEN** the run is unknown, because progress means a run started that the schedule does not show

#### Scenario: Fresh event

- **GIVEN** an unfinished event with an empty schedule and no synced entry
- **WHEN** the runs are resolved
- **THEN** the run is not unknown: `endedRuns` is 0 and the next run is 1, to be announced

### Requirement: The Next token card names the next run

The Next token card of an upcoming event SHALL end its reason line with "for when run N starts", N being the next run, and with "for when the next run starts" when the run is unknown. Both strings are localized in en, de, es and fr.

#### Scenario: Uthar between runs

- **WHEN** the Next token card renders for Uthar with runs 1 and 2 ended
- **THEN** its reason line ends "for when run 3 starts"

#### Scenario: Unknown run

- **WHEN** the Next token card renders for an event in the unknown state
- **THEN** its reason line ends "for when the next run starts"

### Requirement: The unknown state plans one conservative run

In the unknown state the token supply SHALL be one **Next** run with the planned token count (no Done or later runs), the run forecast header SHALL read "By the end of the next run: …", the reward projection SHALL count no future run inputs, and clear depths SHALL be read from and written to run 1. No figure SHALL show a run number.

#### Scenario: Forecast for an unknown run

- **WHEN** the Overview renders for an event in the unknown state
- **THEN** the forecast shows one Next run of 68 tokens, its header reads "By the end of the next run: …", and no run number appears on the Overview
