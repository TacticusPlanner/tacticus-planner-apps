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

Goals/Insights, Today, Bonus Raids, and Raids Plan SHALL use the same recipe-aware need derivation for the same goal, player, inventory, catalog, campaign eligibility, and planning-setting inputs.

#### Scenario: The same project is viewed through Today and Raids Plan

- **GIVEN** a selected project whose goals use owned crafted inventory
- **WHEN** Today and Raids Plan calculate their schedules
- **THEN** Raids Plan's Today day uses the same derived demand and schedule as the Today page

#### Scenario: The same goals are summarized in Insights

- **GIVEN** Goals/Insights and Dailies receive identical goal, player, inventory, catalog, campaign eligibility, and daily-energy inputs
- **WHEN** both calculate total farmable material demand
- **THEN** they apply crafted inventory with the same priority and recipe semantics

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
