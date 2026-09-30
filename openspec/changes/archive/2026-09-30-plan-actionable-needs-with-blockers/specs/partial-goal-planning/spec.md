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

Goals/Insights, Today, and Raids Plan SHALL derive their actionable rows and completion state from the same goal result for identical inputs. Goals and Raids Plan SHALL explain the blockers (Raids Plan in a "Some goals cannot finish yet" panel above the unit filter); Today SHALL show only the actionable schedule and SHALL NOT show that panel. Pausing a goal SHALL remove its actionable rows from the active plan without erasing its stored target or blocker information.

#### Scenario: Mixed goal is viewed across surfaces

- **GIVEN** the mixed Bellator goal above is active in the plan
- **WHEN** Goals/Insights, Today, and Raids Plan are viewed with the same player, catalog, inventory, and settings snapshot
- **THEN** Goals and Raids Plan identify the outstanding B blocker, any displayed A work agrees with the canonical schedule on all three, Today shows no blocker panel, and none claims Bellator can complete

#### Scenario: Inventory later covers the blocker

- **GIVEN** the player obtains the remaining B through an inventory update
- **WHEN** the plan is recomputed
- **THEN** B is no longer reported unavailable and a completion estimate is allowed if all other requirements can be satisfied

### Requirement: Every estimate surface uses one campaign node-eligibility rule

Goals, Insights, per-project estimates, Today, and Raids Plan SHALL choose farm nodes from the same eligible set. A standing-campaign node SHALL be eligible only when the player's synced campaign progress has reached it. An event-campaign node SHALL be eligible only when its campaign is the currently active campaign event and the player's synced event progress has reached it. A material with no eligible node and no supported alternate source SHALL be reported as an unavailable requirement on every surface, with the same blocker reason and no finite completion date.

Assumption: the active campaign event comes from the player's live progress; when it is unknown, no event node is eligible.

#### Scenario: A material that drops only at an inactive event node is blocked everywhere

- **GIVEN** a needed material drops only at nodes of an event campaign that is not the currently active event
- **WHEN** Goals, Insights, Today, and Raids Plan estimate the goal
- **THEN** all four report that material as unavailable with the same reason, and none gives the goal a finite completion date

#### Scenario: The active event's reached node stays eligible

- **GIVEN** a needed material drops at a node of the currently active event that the player has reached
- **WHEN** any surface estimates the goal
- **THEN** that node is eligible and priced on every surface

### Requirement: A partly blocked goal presents as Restricted, a wholly blocked goal as Blocked

On Goals, a goal that has obtainable work scheduled and at least one requirement with no supported source SHALL present with the soft "Restricted" label and treatment. A goal with no obtainable work SHALL present as "Blocked". Both presentations are the same underlying blocked state for filtering, tab placement, and remedy actions. Either presentation SHALL list each unavailable material with its remaining quantity and reason, SHALL show no completion date, and SHALL NOT claim the goal can complete. A goal that is blocked for a reason other than lack of a supported source SHALL keep the existing Blocked/Restricted rules of the goal-blocker-reasons capability.

#### Scenario: A goal with one unfarmable material reads Restricted

- **GIVEN** a Rank goal has several farmable requirements and one requirement (Venerable Battle Mark x6) with no eligible node or supported source
- **WHEN** the Goals list and detail are viewed
- **THEN** the goal shows "Restricted", names Venerable Battle Mark and its reason, shows no completion date, and its farmable work appears in Today and Raids Plan

#### Scenario: A goal with nothing obtainable reads Blocked

- **GIVEN** every remaining requirement of a goal (for example Morvenn Vahl's shards) has no eligible node or supported source
- **WHEN** the Goals list and detail are viewed
- **THEN** the goal shows "Blocked", names the unavailable requirement and its reason, and shows no completion date
