## ADDED Requirements

### Requirement: Within a goal's turn, the longest-to-finish material is farmed first

When a goal farms on a simulated day, the system SHALL spend that goal's share of the daily energy on its still-unfinished materials in descending order of time to finish, as V1 does (`sortLocationsForRaiding`). A material's time to finish SHALL be its remaining count divided by the items per day its selected farm nodes can yield, where each node yields at most the smaller of what the daily energy budget affords and what its daily attempt cap allows, times its drop rate. Ties SHALL keep the material's existing order. A material's nodes SHALL be spent in their existing node order. This ordering SHALL NOT change goal-priority order across goals, the per-battle daily attempt caps shared across every goal and material, inventory allocation, or the set of farm nodes selected.

Assumption: the daily energy budget used for time to finish is `planningSettings.dailyEnergy`, not the energy left after higher-priority goals.

#### Scenario: A capped bottleneck material is farmed before a cheap one

- **GIVEN** a 100-energy day and one goal needing material A (30 remaining) from a 5-energy node capped at 4 attempts (drop rate 1) and material B (30 remaining) from a 10-energy node with no binding cap
- **WHEN** Day 1 is simulated
- **THEN** the goal farms material A first (4 raids, 20 energy) and then material B with the remaining energy
- **AND** material A's time to finish (30 / 4 = 7.5 days) is longer than material B's (30 / 10 = 3 days)

#### Scenario: Bottleneck-first finishes a mixed goal sooner

- **GIVEN** a goal whose cheap materials are uncapped and whose expensive materials are capped per node, at 538 energy per day
- **WHEN** the goal is estimated
- **THEN** it completes no later than under cheapest-node-first ordering
- **AND** for the Neurothrope fixture it completes in 3 days rather than 5

#### Scenario: Equal time to finish keeps the existing order

- **GIVEN** two materials with equal time to finish
- **WHEN** a day is simulated
- **THEN** they are farmed in the order they were before this requirement

#### Scenario: Cross-goal order and shared caps are unchanged

- **GIVEN** two goals with different global priorities that farm the same node
- **WHEN** a day is simulated
- **THEN** the higher-priority goal is still spent first, and both goals draw on the same per-battle daily attempt cap
