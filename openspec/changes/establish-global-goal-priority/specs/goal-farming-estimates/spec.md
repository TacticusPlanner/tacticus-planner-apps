## MODIFIED Requirements

### Requirement: Crafted inventory respects goal priority and farming stages

The system SHALL share one crafted-inventory pool across all account-wide Active goals. It SHALL consume that pool in canonical global priority order and, within each goal, in farming-stage order. Project membership or filter SHALL not restart the pool.

#### Scenario: Two goals require the same crafted upgrade

- **GIVEN** two Active goals in different projects require the same crafted upgrade and owned copies cover only the globally higher-priority goal
- **WHEN** the combined estimate is calculated
- **THEN** the higher-priority goal consumes the copies and the lower-priority goal's remainder expands for farming

#### Scenario: One goal has multiple farming stages

- **GIVEN** multiple ordered stages of one goal need the same crafted upgrade and inventory covers only an earlier stage
- **WHEN** the combined estimate is calculated
- **THEN** the earlier stage consumes the inventory and the later stage retains its unsatisfied demand

### Requirement: A plan estimate spends one shared daily energy budget in configured priority order

For all account-wide Active goals estimated together, the system SHALL simulate one daily energy budget per calendar day, consumed in canonical global priority order. Each goal farms with energy remaining after higher-priority goals and completes on the first day its remaining farmable demand reaches zero. Reordering global priority SHALL change resulting dates. Project views SHALL project per-goal results from this single run, not recalculate a smaller pool. An isolated goal estimate SHALL remain a distinct, explicitly labeled plan-of-one result and SHALL not share resources with other goals. V1's per-material budget model intentionally differs.

Assumptions this requirement depends on:

- Daily energy is `planningSettings.dailyEnergy`, held constant for each simulated day.
- Each battle's daily attempt cap and the energy pool are shared across all Active goals, including goals in different projects.
- Selected shop and Onslaught supply is applied before energy spend and is not energy-bounded; a lower-priority goal can finish on an exhausted-energy day.
- Paused, Completed, and Archived goals do not consume the pool; membership and Current plan do not choose execution scope.

#### Scenario: Worked example — two goals sharing one 100-energy day

- **GIVEN** a 100-energy daily budget and a farm node costing 10 energy per raid with no binding attempt cap
- **AND** a Trajann Rank goal first globally needs 25 raids (250 energy), while an Aesoth Rank goal second globally needs 10 raids (100 energy), even if the two belong to different projects
- **WHEN** the plan estimate runs
- **THEN** Day 1 spends 100 on 10 Trajann raids (15 remain), Day 2 spends 100 on 10 Trajann raids (5 remain), Day 3 spends 50 on 5 Trajann raids and 50 on 5 Aesoth raids (5 remain), and Day 4 spends 50 on the final 5 Aesoth raids
- **AND** Trajann completes in 3 calendar days and Aesoth in 4, while Aesoth alone takes 1 day

#### Scenario: Reordering priorities reorders the dates

- **GIVEN** the same two goals and budget with Aesoth moved first globally
- **WHEN** the plan estimate runs
- **THEN** Aesoth completes on Day 1 and Trajann on Day 4

#### Scenario: An isolated estimate does not share the pool

- **WHEN** the Aesoth goal from the example is estimated in isolation
- **THEN** it completes in 1 day, explicitly distinct from its 4-day global-plan result

#### Scenario: Energy-free supply completes a goal on an exhausted day

- **GIVEN** Trajann drains all Day 1 energy and a lower-priority goal's selected shop offer supplies its entire remaining shard need that day
- **WHEN** Day 1 is simulated
- **THEN** the lower-priority goal completes on Day 1 despite zero remaining energy
