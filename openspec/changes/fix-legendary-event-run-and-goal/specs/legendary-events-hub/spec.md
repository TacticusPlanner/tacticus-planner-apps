# Spec Delta

## MODIFIED Requirements

### Requirement: Legendary Event lifecycle is derived from catalog run dates and the finished flag

For every Legendary Event in the catalog `lres` dataset the system SHALL derive one lifecycle state from `finished` and `eventStageStartDatesUtc` (the run start dates), evaluated against the current UTC instant: `active` when some run start `s` satisfies `s <= now < s + 7 days`; otherwise `upcoming` when `finished` is false (with the earliest run start later than `now` as the next run start, or no run window when none is announced yet, shown as "to be announced"); otherwise `archived` (only `finished` archives an event). Only parseable run starts SHALL participate; an unparseable entry SHALL be ignored.

Assumptions:

- A run lasts 7 days from its start instant (V1's `getLegendaryEventDurationMillis`).
- `eventStageStartDatesUtc` lists the announced run starts in ISO 8601 UTC, index = run − 1, at most three (the API's `legendary-event-run-schedule`).
- The run number is derived from the index of the run start and the clock (`legendary-event-run-resolution`); the synced `currentEventRun` is sent only while a run is active and wins then, and is null between runs.

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
