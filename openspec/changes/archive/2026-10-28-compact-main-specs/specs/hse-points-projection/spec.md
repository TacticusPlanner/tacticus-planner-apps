## MODIFIED Requirements

### Requirement: Tokens available per mode come from the synced buckets

For a running or upcoming instance whose resolved variant is `Personal` and has a tracker scoring in Arena, Onslaught or Salvage Run, the system SHALL compute the tokens the player can use in each such mode until the event ends, in tokens. The unit of every figure in the projection except tokens and per-unit averages is **event points**.

- Running: with `observedAt` the instant the buckets were synced and `from = max(observedAt, start)`:
  - A bucket that is not full (`current < max`) has `next = observedAt + nextTokenInSeconds`. A full bucket (`current >= max`; the player data then reports `nextTokenInSeconds` 0 because the countdown has stopped) has no pending token: its next token lands one regeneration after it is first spent, `next = from + regenDelay`.
  - Synced before the start (`observedAt < start`): the bucket is rolled forward to the start, `held = min(max, current + arrivals before start)` where arrivals are `next`, `next + regenDelay`, …; if `held` reaches `max`, `next = start + regenDelay`, otherwise `next` is the first arrival at or after the start. Otherwise `held = current`.
  - `tokens = held + (next < end ? 1 + floor((end - next) / regenDelay) : 0)`.
- Upcoming: `tokens = max + floor((end - start) / regenDelay)`.

A mode whose synced bucket is null (not unlocked) SHALL be left out with a note naming it.

Assumptions:

- Arena, Onslaught and Salvage Run each spend exactly one token per battle.
- The player spends tokens before the bucket caps, so no regeneration is lost.
- For an upcoming event the bucket is full when the event starts.
- Regeneration delay and cap are the synced values; no game constants are hard-coded.

#### Scenario: Upcoming Psyker Boost (illustrative buckets)

- **GIVEN** Psyker Boost from 2026-10-19T08:00Z to 2026-10-23T08:00Z (96 hours) and synced buckets Arena max 10 / regen 2 h, Onslaught max 3 / regen 8 h, Salvage Run max 2 / regen 8 h (example values, not game constants)
- **THEN** Arena has 10 + floor(96 / 2) = 58 tokens, Onslaught 3 + floor(96 / 8) = 15, Salvage Run 2 + floor(96 / 8) = 14

#### Scenario: Running Psyker Boost

- **GIVEN** the buckets were synced at 2026-10-21T08:00Z, 48 hours before the end: Arena 4 of 10, next in 1 h, regen 2 h; Onslaught 1 of 3, next in 2 h, regen 8 h; Salvage Run 2 of 2 (full, next in 0), regen 8 h
- **THEN** Arena has 4 + 1 + floor(47 / 2) = 28 tokens, Onslaught 1 + 1 + floor(46 / 8) = 7, Salvage Run 2 + 1 + floor(40 / 8) = 8 (its next token one regeneration after it is spent)

#### Scenario: Running event synced before it started

- **GIVEN** Psyker Boost from 2026-10-19T08:00Z to 2026-10-23T08:00Z, running, with the Arena bucket synced at 2026-10-16T08:00Z: 4 of 10, next in 1 h, regen 2 h
- **THEN** the bucket rolls forward to min(10, 4 + 36) = 10 at the start and Arena has 10 + floor(96 / 2) = 58 tokens, not 4 + 1 + floor(167 / 2) = 88

#### Scenario: Full bucket

- **GIVEN** a running event 10 hours from its end and an Arena bucket synced now at 10 of 10, next in 0, regen 2 h
- **THEN** Arena has 10 + floor(10 / 2) = 15 tokens (the stopped countdown adds no token)

#### Scenario: Mode not unlocked

- **GIVEN** the Onslaught bucket is null
- **THEN** Onslaught is left out of the projection with a note that it is not unlocked
