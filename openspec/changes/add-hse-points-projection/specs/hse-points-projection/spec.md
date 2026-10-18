## ADDED Requirements

### Requirement: Tokens available per mode come from the synced buckets

For a running or upcoming instance whose resolved variant is `Personal` and has a tracker scoring in Arena, Onslaught or Salvage Run, the system SHALL compute the tokens the player can use in each such mode until the event ends, in tokens. The unit of every figure in the projection except tokens and per-unit averages is **event points**.

- Running: with `observedAt` the instant the buckets were synced and `from = max(observedAt, start)`:
  - A bucket that is not full (`current < max`) has `next = observedAt + nextTokenInSeconds`. A full bucket (`current >= max`; the player data then reports `nextTokenInSeconds` 0 because the countdown has stopped) has no pending token: its next token lands one regeneration after it is first spent, `next = from + regenDelay`.
  - Synced before the start (`observedAt < start`): the bucket is rolled forward to the start, `held = min(max, current + arrivals before start)` where arrivals are `next`, `next + regenDelay`, …; if `held` reaches `max`, `next = start + regenDelay`, otherwise `next` is the first arrival at or after the start. Otherwise `held = current`.
  - `tokens = held + (next < end ? 1 + floor((end - next) / regenDelay) : 0)`.
- Upcoming: `tokens = max + floor((end - start) / regenDelay)`.

A mode whose synced bucket is null (not unlocked) SHALL be left out with a note naming it. Past instances SHALL NOT be projected.

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

### Requirement: The projection shows what reaching the final milestone takes

The projection SHALL show: the target (the resolved tier's final cumulative milestone); points so far (an optional input, running events only, default 0) and the remaining points `max(0, target - pointsSoFar)`; per mode its tokens, its unit (kills for `KillUnits`, waves for `DefeatWaves`, battles for `DeployedUnitsOfFactionMajority` and `FullLineUpOfFaction`) and its points per unit (the sum of the points of every tracker whose `gameModes` pass the mode, stated as assuming each unit matches all of them); the units to defeat to reach the final milestone, `ceil(remaining / pointsPerUnit)`, when every shown mode has the same unit and points per unit; and the required average per token, `remaining / sum(tokens x pointsPerUnit)` rounded up to one decimal, expressed in that shared unit or otherwise in event points per token.

Assumptions:

- Points per unit come only from served trackers; enemy-side restrictions (For the Emperor, Squig Smash) are stated, not modelled.
- A battle-unit mode scores once per token (one battle per token, one full line-up of one faction).

#### Scenario: Upcoming Psyker Boost requirement

- **GIVEN** High tier (target 765), no points so far, tokens 58 / 15 / 14 and 1 point per kill in every mode
- **THEN** remaining is 765, units to defeat is ceil(765 / 1) = 765 kills, and the required average is 765 / (58 + 15 + 14) = 765 / 87 = 8.79, shown as 8.8 kills per token

#### Scenario: Running Psyker Boost with points so far

- **GIVEN** target 765, points so far 300, tokens 28 / 7 / 8
- **THEN** remaining is 465, units to defeat 465 kills, required average 465 / 43 = 10.81, shown as 10.9 kills per token

#### Scenario: Several trackers in a mode

- **GIVEN** Faction Boost, Dark Angels variant, High tier (target 1000), whose Arena trackers give 2 points per kill by an Imperial unit and 1 per kill by a Dark Angels unit
- **THEN** Arena has 3 points per kill with the note that a kill by a Dark Angels unit matches both, and units to defeat is ceil(1000 / 3) = 334 kills

#### Scenario: Battle-based event

- **GIVEN** Faction Focus, whose trackers give 1 + 2 = 3 points per Arena battle and 3 + 5 = 8 per Onslaught and Salvage Run battle
- **THEN** no units-to-defeat figure is shown and the required average is in event points per token

#### Scenario: Target already reached

- **GIVEN** points so far 800 and target 765
- **THEN** remaining is 0 and the projection says the final milestone is reached, with repeats counted from the repeat step

### Requirement: Average per token projects the milestone reached

Each shown mode SHALL have an editable average units per token, defaulting to 5 kills for Arena, 20 kills for Onslaught and 12 kills for Salvage Run, empty for waves, and fixed at 1 for battles. Projected points SHALL be `pointsSoFar + sum(tokens x average x pointsPerUnit)`; the projection SHALL show them with the number of milestones reached of the total, the points to the next milestone, and, past the final milestone, the number of repeat steps reached (`floor((projected - target) / repeatStep)`, capped by `cap`). With an empty average in any mode the projected points SHALL NOT be shown and the mode SHALL ask for its average. Averages SHALL persist per browser per event definition and mode; points so far SHALL persist per instance; neither is shared with other Dailies tabs.

Assumptions:

- Kill defaults are rough estimates (Arena: five enemies per battle; Onslaught and Salvage Run per Severyn) and are meant to be edited.

#### Scenario: Upcoming Psyker Boost projection

- **GIVEN** tokens 58 / 15 / 14 and the default averages 5 / 20 / 12
- **THEN** projected points are 58 x 5 + 15 x 20 + 14 x 12 = 290 + 300 + 168 = 758, reaching 18 of 19 milestones (705), 7 points short of 765

#### Scenario: Running Psyker Boost projection

- **GIVEN** points so far 300, tokens 28 / 7 / 8 and the default averages
- **THEN** projected points are 300 + 140 + 140 + 96 = 676, reaching 17 of 19 milestones (645), 29 points to the next (705)

#### Scenario: Past the final milestone

- **GIVEN** projected points 880 on the High tier
- **THEN** all 19 milestones are reached and floor((880 - 765) / 50) = 2 repeat steps

#### Scenario: Edited average persists

- **WHEN** the player sets Onslaught to 25 kills per token on Psyker Boost and reloads
- **THEN** Onslaught shows 25 for Psyker Boost and still 20 for Flying Boost

#### Scenario: Waves need an average

- **GIVEN** Defeat Waves with no average entered
- **THEN** the required average in waves per token is shown, and the projected points are not, until an average is entered for each mode

### Requirement: The projection handles its states

The projection SHALL NOT be shown for a past instance, a `Global` variant (the details say why), an instance without `config.hse`, or a variant without a tracker scoring in Arena, Onslaught or Salvage Run (Arsenal of War, Conflict Operations), in which case the details stand alone. While player data loads it SHALL show a loading state, and on a read failure an inline error that does not block the details or the raid lists. When every scoring mode is not unlocked it SHALL say so.

#### Scenario: Guild event

- **GIVEN** Arsenal of War is selected
- **THEN** its details are shown and no projection

#### Scenario: Raid event that also scores in Arena

- **GIVEN** Warp Surge (25 points per Chaos kill in Arena, raid points in campaigns) is running
- **THEN** the projection covers Arena only and says campaign raids are planned in the farm list below

#### Scenario: On mobile

- **WHEN** the viewport is below 768px
- **THEN** each mode is a stacked row with its tokens, average input and points, and the totals sit above the rows

#### Scenario: On desktop

- **WHEN** the viewport is at or above 768px
- **THEN** the modes form a table with columns mode, tokens, average, points per unit and points, and the totals sit beside the event details
