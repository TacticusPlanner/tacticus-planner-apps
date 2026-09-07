## ADDED Requirements

### Requirement: The estimator attributes contributed shards to each selected source

When the estimator simulates an Unlock or Ascension goal's selected acquisition sources
concurrently across farming days, it SHALL record how many shards **each individual selected
non-campaign source** contributed over the whole run — separately per shop offer and for the
Onslaught source — not only the combined flat supply per shard resource. This per-source
attribution SHALL be available to estimate consumers alongside the goal's day count, energy,
and raid totals.

The sum of every source's attributed contribution plus the campaign-farmed amount SHALL equal
the goal's satisfied shard requirement. A source that was offered but not selected, or that
contributed nothing (for example an offer whose weekdays never came up before the goal
completed), SHALL be attributed zero.

#### Scenario: Two shop offers and Onslaught each attributed separately

- **GIVEN** an Ascension goal needing 100 regular shards with Onslaught and two different shop
  offers selected, all supplying the same shard resource
- **WHEN** the estimate is derived
- **THEN** the result reports each shop offer's contributed shard total and Onslaught's
  contributed shard total separately, and those plus the campaign-farmed shards sum to 100

#### Scenario: Unavailable-day offer attributed zero

- **GIVEN** a selected shop offer available only on a weekday the simulation never reaches
  before the goal completes
- **WHEN** the estimate is derived
- **THEN** that offer's attributed contribution is zero and the other sources' attributions
  are unchanged

#### Scenario: Contribution attribution does not change day count or energy

- **GIVEN** the same goal and selected sources
- **WHEN** the estimate is derived with and without reading the per-source attribution
- **THEN** the goal's day count, completion date, energy total, and raid total are identical;
  only the additional per-source breakdown is new

#### Scenario: Attribution is independent of the order sources were selected

- **GIVEN** two selected sources that supply the same shard resource
- **WHEN** the estimate is derived twice with those two sources in opposite order
- **THEN** each source's attributed contribution is identical between the two runs (the split on
  the day the requirement is exhausted does not depend on selection order)
