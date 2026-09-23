## Purpose

Defines how an otherwise blocked goal contributes achievable work to a shared plan without presenting an impossible completion estimate.

## ADDED Requirements

### Requirement: A blocked requirement does not discard actionable sibling requirements

The planner SHALL classify each unsatisfied material requirement after owned inventory, configured farming overrides, and supported alternate supply have been applied. It SHALL schedule obtainable requirements in goal-priority and stage order even when another requirement of that goal has no supported available source. It SHALL report every remaining unavailable requirement and SHALL NOT report the goal as completed or give it a finite completion date while one remains.

Assumptions:

- Campaign nodes are limited by the catalog's energy-per-raid and daily attempt cap; a selected flat supplier is limited by its existing cadence.
- A guaranteed drop yields its catalog amount; an RNG drop uses the estimator's existing expected-yield rule. This change does not invent new sources or change source-selection semantics.

#### Scenario: Worked mixed-needs example for a real character

- **GIVEN** a Bellator Rank goal needs 2 of material A and 1 of material B after recipe expansion, owns 1 A and 0 B, has a guaranteed available node yielding 1 A per 6-energy raid, and has no supported source for B
- **WHEN** the plan is computed with at least 6 daily energy and an available attempt
- **THEN** the remaining A demand is 1, the actionable schedule contains 1 raid costing 6 energy for A, B is listed as unavailable with remaining quantity 1, and Bellator has no finite completion date or completed status

#### Scenario: Supported alternate source removes a blocker

- **GIVEN** a required material has no eligible campaign node but a selected supported supplier can provide it
- **WHEN** the plan is computed
- **THEN** the material is scheduled through that supplier under its existing cadence rather than marked unavailable

#### Scenario: No actionable work remains

- **GIVEN** all remaining requirements are unavailable after inventory and selected supported sources
- **WHEN** the plan is computed
- **THEN** no raids are scheduled for that goal, every unsatisfied requirement is reported, and completion remains indeterminate

### Requirement: One partial result drives all planning surfaces

Goals/Insights, Today, and Raids Plan SHALL derive their actionable rows, blocker explanations, and completion state from the same goal result for identical inputs. Pausing a goal SHALL remove its actionable rows from the active plan without erasing its stored target or blocker information.

#### Scenario: Mixed goal is viewed across surfaces

- **GIVEN** the mixed Bellator goal above is active in the plan
- **WHEN** Goals/Insights, Today, and Raids Plan are viewed with the same player, catalog, inventory, and settings snapshot
- **THEN** each identifies the outstanding B blocker, any displayed A work agrees with the canonical schedule, and none claims Bellator can complete

#### Scenario: Inventory later covers the blocker

- **GIVEN** the player obtains the remaining B through an inventory update
- **WHEN** the plan is recomputed
- **THEN** B is no longer reported unavailable and a completion estimate is allowed if all other requirements can be satisfied
