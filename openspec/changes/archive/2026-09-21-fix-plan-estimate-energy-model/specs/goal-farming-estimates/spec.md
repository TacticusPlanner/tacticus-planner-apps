## ADDED Requirements

### Requirement: A plan estimate spends one shared daily energy budget in configured priority order

For a set of goals estimated together (a project's in-scope goals), the system
SHALL simulate **one** daily energy budget per calendar day and spend it across
those goals in ascending configured-priority order. On each simulated day a goal
SHALL farm only with the energy remaining after every higher-priority goal has
taken its turn that day, and a goal SHALL complete on the first day its
remaining farmable demand reaches zero. A goal's completion date therefore
depends on the goals ordered above it, and reordering priorities SHALL change
the resulting dates.

An estimate computed for a single goal in isolation — no project context — SHALL
NOT share a pool with any other goal and is a different figure from that goal's
place in a plan. Surfaces that show both SHALL distinguish them (see
`goal-detail-estimate-display`).

This supersedes any model that gives each goal, material, or farming stage its
own full daily budget. V1 (`tacticusplanner`) uses such a per-material model and
its dates are expected to differ from V2's for every goal below the first in
priority order, with the gap widening down the list; that divergence is a
deliberate difference in model, not a defect in either implementation.

Assumptions this requirement depends on:

- The daily energy budget is `planningSettings.dailyEnergy` and is the same on
  every simulated day.
- Each battle's daily attempt cap is shared across goals within the same
  simulated day, alongside the energy pool — two goals farming the same battle
  contend for both.
- Energy-free supply (a selected shop offer, Onslaught) is applied to a goal
  before the day's energy pool is touched and is **not** bounded by it — a
  lower-priority goal can complete from its own non-campaign sources on a day
  whose energy is already exhausted (see "Selected acquisition sources are
  simulated concurrently across farming days").
- Priority is the goal's position within the project being estimated; goals
  outside that project do not consume the pool.

#### Scenario: Worked example — two goals sharing one 100-energy day

- **GIVEN** a daily energy budget of 100, and a farm node costing 10 energy per
  raid with no binding daily attempt cap
- **AND** a Trajann Rank goal at priority 1 whose remaining demand takes 25 raids
  (250 energy) and an Aesoth Rank goal at priority 2 whose remaining demand takes
  10 raids (100 energy)
- **WHEN** the plan estimate is calculated
- **THEN** day 1 spends all 100 energy on Trajann (15 raids remaining), day 2
  spends all 100 on Trajann (5 raids remaining), day 3 spends 50 finishing
  Trajann and the surviving 50 on Aesoth (5 raids remaining), and day 4 finishes
  Aesoth
- **AND** Trajann's outcome is 3 days and Aesoth's is 4 days — where Aesoth
  estimated alone against the same budget is 1 day

#### Scenario: Reordering priorities reorders the dates

- **GIVEN** the same two goals and budget, with Aesoth moved to priority 1
- **WHEN** the plan estimate is recalculated
- **THEN** Aesoth's outcome is 1 day and Trajann's is 4 days

#### Scenario: An isolated estimate does not share the pool

- **GIVEN** the Aesoth goal from the worked example, estimated on its own with no
  project context
- **WHEN** its estimate is calculated
- **THEN** it is 1 day, unaffected by any other goal's demand

#### Scenario: Energy-free supply completes a goal on an exhausted day

- **GIVEN** the worked example's Trajann goal draining the full daily budget, and
  a lower-priority goal whose selected shop offer supplies its entire remaining
  shard requirement on day 1
- **WHEN** day 1 is simulated
- **THEN** the lower-priority goal completes on day 1 despite zero energy
  remaining after Trajann's turn
