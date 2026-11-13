## Purpose

Gives the client game-catalog package the seasonal event shops: the synced `event-shops` dataset, a query to read it, and helpers that turn an event plus a moment in time into an event day, its date, and that day's resolved shop slots.

## ADDED Requirements

### Requirement: The `event-shops` dataset is synced and stored one record per event

The client SHALL treat `event-shops` as a served game-catalog dataset: it participates in the manifest-diff sync, is validated against a schema on download, and is stored in the game-catalog IndexedDB database as one record per event keyed by its `id`. Adding the store SHALL follow the package's version-cascade upgrade mechanism. The dataset SHALL be listed among the datasets the cache counts as complete without, so an API that does not serve it yet leaves the client ready and the feature sees no events.

#### Scenario: Events sync into their own store

- **WHEN** a sync includes `event-shops` with three events
- **THEN** the `event-shops` store holds three records retrievable by id

#### Scenario: Malformed payload is rejected

- **WHEN** an `event-shops` payload fails schema validation
- **THEN** the sync reports the failure like any other dataset and the store is not partially written

#### Scenario: Dataset absent from the API

- **WHEN** the manifest does not list `event-shops`
- **THEN** the catalog still becomes ready and the event shop query returns no events, so the page shows its empty state as for a served-but-empty dataset

### Requirement: A stored event exposes the served structure unchanged

Each stored record SHALL expose `id`, `eventKey`, `definitionId`, `currency`, `startUtc`, `dayCount`, `milestones` and `weeks` (each with `week`, optional `estimatedWeeklyIncome`, `slots`, `progressChests`, `missions`) exactly as served; each slot's variants SHALL have the same typed shape as daily-shop variants, so the existing shop resolver accepts them without conversion.

#### Scenario: Event slot variants are shop variants

- **WHEN** a feature passes an event week's slots to the daily-shop permissive resolver
- **THEN** it type-checks and resolves without mapping

### Requirement: Event day helpers map time to event days

The package SHALL provide pure helpers that, for an event and an instant, return: the event day index `floor((instant − startUtc) / 1 day)` (may be negative or ≥ `dayCount`); the event status `upcoming` (index < 0), `running` (0 ≤ index < `dayCount`) or `ended` (index ≥ `dayCount`); for any day index in 0..`dayCount − 1`, its `week` (`floor(index / 7) + 1`), its UTC calendar date and its day of week; and the default selected day (today when running, day 0 when upcoming, the last day when ended). Days SHALL be UTC days, matching the 00:00 UTC shop rotation.

Assumptions:

- Event shops rotate at 00:00 UTC, like the daily shops.
- Week `w` day `d` (0-based within the week) is event day `7(w − 1) + d`; an event need not start on a Monday.

#### Scenario: Wednesday-start event maps days

- **WHEN** an event has `startUtc` 2026-08-05T00:00:00Z (a Wednesday) and the instant is 2026-08-13T10:00:00Z
- **THEN** the day index is 8, the status is `running`, the day is week 2, date 2026-08-13, day of week `THU`

#### Scenario: Before and after the event

- **WHEN** a 7-day event starts 2026-10-26 and the instant is 2026-10-20
- **THEN** the status is `upcoming` and the default selected day is 0
- **WHEN** the instant is 2026-11-09
- **THEN** the status is `ended` and the default selected day is 6

### Requirement: An event day's slots resolve through the shop resolver

The package SHALL provide a helper that, given an event, a day index and an optional power-level and lock context, returns that day's slots by passing the day's week slots and day of week to the permissive shop resolver — grouped "one of these" options per slot, each with reward, free offer, cost and per-day cap, and the slot's index in the week. Without a lock context, roster-dependent locks SHALL count as possibly available, as for daily shops. Time-bound locks (battle-pass season windows, crusade and featured rotations) SHALL resolve as of the later of the given instant and the start of that event day, so a future day shows what it will sell on that day.

#### Scenario: Day-restricted offer appears only on its days

- **WHEN** week 1 slot 1 offers `shards_astraYarrick` only on `MON`, `THU` and `SUN`
- **THEN** the helper lists it on Monday, Thursday and Sunday of week 1 and not on the other days

#### Scenario: A season boundary inside the event

- **WHEN** a slot sells gold until battle-pass season 41 starts and gems after it, season 41 starts on day 3 of the event, and the helper is asked on day 0 for day 5
- **THEN** day 0 lists gold and day 5 lists gems

### Requirement: The package exposes event shop queries

The package SHALL expose a query returning every stored event (ordered by `startUtc`) and one returning a single event by id, through its public query surface.

#### Scenario: Read one event by id

- **WHEN** a feature queries event `october-2026`
- **THEN** it receives that stored record, or `undefined` when no such event is stored
