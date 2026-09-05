# goal-farming-estimates Specification

## Purpose

Defines consistent recipe-aware inventory and calendar semantics for every V2 goal-farming estimate, so identical planning inputs produce the same material demand regardless of which page presents the result.

## Requirements

### Requirement: Crafted inventory is applied before recipe expansion

The system SHALL use an owned crafted upgrade to satisfy a matching crafted requirement before expanding that requirement into farmable base materials. Only the unsatisfied crafted remainder SHALL be recursively expanded.

#### Scenario: Player owns the required top-level crafted upgrade

- **GIVEN** a goal requires a crafted upgrade and the player owns enough copies of that exact crafted upgrade
- **WHEN** the system derives the goal's farmable material demand
- **THEN** the owned copies satisfy the requirement and none of that crafted upgrade's recipe ingredients are added to the farming estimate

#### Scenario: Player owns a nested crafted ingredient

- **GIVEN** a required crafted upgrade contains another crafted upgrade in its recursive recipe and the player owns some copies of that nested crafted upgrade
- **WHEN** the system derives the farmable material demand
- **THEN** the owned nested copies are consumed at that recipe level and only the remaining nested requirement is expanded into base materials

#### Scenario: Crafted inventory is not decrafted for an unrelated need

- **GIVEN** the player owns a crafted upgrade whose recipe contains a base material needed elsewhere, but no goal requires that crafted upgrade
- **WHEN** the system allocates inventory
- **THEN** the crafted upgrade is not converted into ingredient credit for the unrelated base-material need

### Requirement: Crafted inventory respects goal priority and farming stages

The system SHALL share one crafted-inventory pool across the selected project's in-scope goals. It SHALL consume that pool in configured goal-priority order and, within each goal, in farming-stage order.

#### Scenario: Two goals require the same crafted upgrade

- **GIVEN** two goals require the same crafted upgrade and owned copies cover only the higher-priority goal
- **WHEN** the combined estimate is calculated
- **THEN** the higher-priority goal consumes the owned copies and the lower-priority goal's unsatisfied requirement is expanded for farming

#### Scenario: One goal has multiple farming stages

- **GIVEN** multiple ordered stages of one goal require the same crafted upgrade and inventory covers only an earlier stage
- **WHEN** the combined estimate is calculated
- **THEN** the earlier stage consumes the inventory and the later stage retains its unsatisfied farming demand

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

### Requirement: Completion dates are inclusive of the first farming day

The system SHALL treat the reference date as Day 1 for an estimate that requires farming. An N-day estimate SHALL complete N - 1 calendar days after the reference date; a zero-day estimate SHALL complete on the reference date.

#### Scenario: One-day estimate

- **GIVEN** an estimate whose remaining demand is completed within one farming day
- **WHEN** its completion date is calculated
- **THEN** the completion date equals the reference date

#### Scenario: Multi-day estimate

- **GIVEN** an estimate that requires N farming days where N is greater than one
- **WHEN** its completion date is calculated
- **THEN** the completion date is N - 1 calendar days after the reference date

#### Scenario: No farming remains

- **GIVEN** existing inventory already covers all farmable demand
- **WHEN** the estimate is calculated as zero days
- **THEN** the completion date equals the reference date

### Requirement: Simultaneous rewards contribute to one raid yield

The system SHALL calculate a farm node's expected resource yield as the sum of every reward entry for that resource and battle that is granted by the same raid. A catalog-provided combined effective rate SHALL take precedence over the guaranteed fallback rate.

#### Scenario: Combined elite shard location

- **GIVEN** a catalog location is guaranteed and has a combined effective rate of `1.079`
- **WHEN** the estimator calculates that node's shard yield
- **THEN** one raid contributes `1.079` expected shards rather than `1`

#### Scenario: Cached catalog has split simultaneous entries

- **GIVEN** a cached catalog contains separate `1` guaranteed and `0.079` potential locations for the same shard and battle
- **WHEN** the estimator builds farm-node candidates
- **THEN** it combines them into one node with an expected yield of `1.079` and applies the battle's attempt cap only once

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
