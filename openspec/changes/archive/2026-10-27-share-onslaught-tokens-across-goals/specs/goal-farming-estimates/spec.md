## ADDED Requirements

### Requirement: Onslaught tokens are shared across goals in priority order

When several goals are estimated together (Goals/Insights plan figures, Today, Schedule), the
Onslaught run cadence SHALL be one daily pool of runs shared by every goal with Onslaught selected.
Goals SHALL draw runs from it in canonical global priority order; each goal SHALL take at most the
runs its remaining shard need requires (its need over its shards per run) and at most the runs
higher-priority goals left that day. A goal that completes partway through a day SHALL leave its
unused runs to the next goal. Unused runs SHALL NOT carry over to the next day. Regular and Mythic
Onslaught sources SHALL draw on the same pool. A single-goal estimate such as the goal-creation
preview SHALL treat the goal as the only user of Onslaught.

Assumption: Onslaught tokens are per account, not per goal.

#### Scenario: The first Onslaught goal takes every run

- **GIVEN** two Ascension goals whose only selected source is Onslaught, at 1.5 runs per day:
  Kharn at priority 1 needing 12 shards at 4 shards per run, and Calgar at priority 2 needing 6
  shards at 2 shards per run
- **WHEN** the plan is computed
- **THEN** Days 1 and 2 give Kharn 1.5 runs (6 shards) each and Calgar none, so Kharn completes
  on Day 2
- **AND** Calgar takes 1.5 runs (3 shards) on Days 3 and 4 and completes on Day 4, not on Day 2
  as it would if each goal had Onslaught to itself

#### Scenario: Leftover runs pass to the next goal

- **GIVEN** the Kharn goal above needs 8 shards instead of 12
- **WHEN** the plan is computed
- **THEN** on Day 2 Kharn takes 0.5 runs (2 shards) and completes, and Calgar takes the remaining
  1 run (2 shards) that day
