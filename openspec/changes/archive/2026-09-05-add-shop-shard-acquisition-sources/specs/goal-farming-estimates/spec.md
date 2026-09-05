## MODIFIED Requirements

### Requirement: Shared estimate consumers use the same derived demand

Goals/Insights, Today, Bonus Raids, and Raids Plan SHALL use the same recipe-aware need
derivation for the same goal, player, inventory, catalog, campaign eligibility, selected
acquisition sources, and planning-setting inputs.

#### Scenario: The same project is viewed through Today and Raids Plan

- **GIVEN** a selected project whose goals use owned crafted inventory
- **WHEN** Today and Raids Plan calculate their schedules
- **THEN** Raids Plan's Today day uses the same derived demand and schedule as the Today page

#### Scenario: The same goals are summarized in Insights

- **GIVEN** Goals/Insights and Dailies receive identical goal, player, inventory, catalog,
  campaign eligibility, and daily-energy inputs
- **WHEN** both calculate total farmable material demand
- **THEN** they apply crafted inventory with the same priority and recipe semantics

#### Scenario: A goal with shop and Onslaught sources is viewed through multiple consumers

- **GIVEN** an Ascension goal whose selected acquisition sources include a daily-shop offer and
  Onslaught
- **WHEN** Goals/Insights, Today, and Raids Plan derive that goal's remaining shard demand
- **THEN** each applies the same shop and Onslaught contribution and arrives at the same
  campaign farming demand and schedule

## ADDED Requirements

### Requirement: Selected acquisition sources are simulated concurrently across farming days

For an Unlock or Ascension goal, the estimator SHALL simulate every selected acquisition
source **concurrently across farming days** against one shared remaining shard requirement. On
each simulated day, each selected source contributes the shards it makes available **that
day**, each bounded by its own daily limit:

- campaign farming — bounded by the node's daily attempt cap and then that day's energy
  budget;
- a shop offer — bounded by its per-day purchasable amount on the offer's available weekdays,
  and zero on other weekdays;
- Onslaught — bounded by its per-run shard yield at the current Onslaught run cadence.

The day's combined contribution SHALL reduce the shared remaining requirement. A source SHALL
never contribute negative shards, a day's combined contribution SHALL be capped at the
then-remaining requirement, and the goal SHALL complete on the first day the remaining
requirement reaches zero. This supersedes any model that estimates a single source in
isolation or treats selected sources as alternatives (for example taking the maximum of a
campaign-only and an Onslaught-only day count).

#### Scenario: Sources combine additively toward one requirement

- **GIVEN** an Ascension goal needing 100 regular shards with a campaign node (≈6 shards/day
  after its attempt cap), Onslaught (≈7 shards/day), and a guaranteed daily shop offer
  (10 shards/day) all selected
- **WHEN** the estimate is derived
- **THEN** the three per-day contributions are summed each day against the 100-shard
  requirement and the completion date reflects roughly 100 / 23 days, not the campaign-only
  or Onslaught-only day count

#### Scenario: Combined daily supply is capped at the remaining requirement

- **GIVEN** the final simulated day begins with 5 shards still required and the selected
  sources together make 23 shards available that day
- **WHEN** that day is simulated
- **THEN** only 5 shards are credited, the requirement reaches zero, and no surplus is carried
  into any other goal or resource

#### Scenario: A source contributes nothing on a day it is unavailable

- **GIVEN** a selected shop offer available only on Tuesday and Friday
- **WHEN** a Wednesday is simulated
- **THEN** that offer contributes zero shards that day and never a negative amount

#### Scenario: Deselecting a source restores campaign demand

- **GIVEN** a goal with a selected shop source
- **WHEN** the user deselects that shop source
- **THEN** the remaining simulation covers the full outstanding requirement from the still-
  selected sources and the campaign farming demand and estimate rise accordingly

### Requirement: A selected shop source supplies a bounded, expected-value per-day amount

A selected daily-shop offer SHALL be projected to supply, on each weekday the offer can
appear, its expected purchasable shards for that weekday — `shardsPerPurchase` times
`maxPurchasesPerDay` times the probability that the offer's slot resolves to this unit's
shards on that weekday — and zero on other weekdays. For a slot with a single day-matching
variant that probability SHALL be 1. For a rotating slot whose day-matching variants yield
more than one reward, the probability SHALL be the offer's variant weight over the sum of the
weights of that slot's day-matching variants, after excluding variants ruled out by a
resolvable lock condition. This supply SHALL NOT consume daily energy and SHALL NOT add raids
to any farm schedule, and the offer's currency cost SHALL NOT block or alter the estimate.

#### Scenario: Guaranteed daily offer

- **GIVEN** a shop offer that is the only reward its slot can yield, available every day, at 5
  shards per purchase and a cap of 2 purchases per day
- **WHEN** its shard supply is projected
- **THEN** it supplies 10 shards on every simulated day

#### Scenario: Rotating-slot offer is credited at its expected value

- **GIVEN** a shop slot that on Tuesday and Friday resolves to either this unit's shards or
  another unit's shards at equal weight, at 5 shards per purchase and a cap of 2 per day
- **WHEN** this unit's shard supply from that offer is projected
- **THEN** it supplies an expected 5 shards on each Tuesday and Friday (2 × 5 × 0.5) and zero
  on other days

#### Scenario: Availability-day bounding

- **GIVEN** a shop offer granting 5 shards per purchase, a cap of 1 purchase per day, that can
  appear on 3 weekdays with probability 1
- **WHEN** its weekly shard supply is projected
- **THEN** it supplies at most 15 shards per week and nothing on the other 4 days

#### Scenario: No energy or raids consumed

- **WHEN** a shop source contributes shards to a goal
- **THEN** the goal's daily energy budget and raid counts are unchanged by that contribution

### Requirement: A selected Onslaught source supplies its per-run shard yield

For a Character Ascension goal with Onslaught selected, the system SHALL project Onslaught's
shard supply from the per-run yield for the player's saved Onslaught progress and the current
Onslaught run cadence, consuming no daily energy. The goal's ascension-orb requirement and orb
estimate SHALL NOT be affected by Onslaught selection.

#### Scenario: Onslaught reduces shard demand only

- **GIVEN** a Character Ascension goal with Onslaught selected
- **WHEN** the estimate is derived
- **THEN** Onslaught's projected per-run shards reduce the campaign shard demand while the
  goal's ascension-orb requirement is unchanged

#### Scenario: Onslaught cadence

- **WHEN** Onslaught's shard supply is projected over a period
- **THEN** it uses the current Onslaught run cadence rather than a campaign raid schedule
