## ADDED Requirements

### Requirement: Upgrade goals contribute farming demand

An Active Upgrade goal SHALL contribute, to every shared estimate consumer (Today's raids, the
Raids Plan/Schedule, plan insights, remaining-resources and overview metrics), a single flat need
made of each target's upgrade × quantity expressed as farmable base upgrades. The goal SHALL be
ordered by canonical global priority like any other goal and SHALL have no farming stages. Owned
inventory SHALL be netted by the existing priority-ordered allocation, not inside the goal. A
Paused goal SHALL contribute nothing. A goal whose resulting need is empty SHALL be omitted.

Assumptions:

- An Upgrade goal targets base (non-crafted) upgrades; the create picker offers no crafted ids.
- Inventory is shared across goals and consumed in global priority order.

#### Scenario: Upgrade goal appears in Today and the Schedule

- **GIVEN** an Active Upgrade goal for `ultraApothecary` targeting `upgArmC002` × 5, with 0 owned
- **WHEN** Today's raids and the Raids Schedule are calculated
- **THEN** both include a farming need of 5 `upgArmC002` attributed to that goal

#### Scenario: Priority orders the goal

- **GIVEN** two Active goals competing for the same daily energy, the Upgrade goal at higher
  global priority
- **WHEN** the plan is calculated
- **THEN** the Upgrade goal's materials are farmed before the lower-priority goal's

#### Scenario: Inventory covers the target

- **GIVEN** an Upgrade goal for `upgArmC002` × 5 and 5 owned
- **WHEN** the plan is calculated
- **THEN** the goal contributes no farming and does not appear in the schedule

### Requirement: Upgrade goals do not double-charge slots a Rank or Ability goal already claims

When an Upgrade goal carries a range and an earlier or later Rank/Ability goal on the same unit
charges slots of a targeted upgrade inside that range, the Upgrade goal's need for that upgrade
SHALL be reduced by the number of such overlapping slots, capped at the Upgrade goal's own
quantity for that upgrade. The Upgrade goal SHALL claim up to its quantity of those slots so that
a later goal sees them covered, making the total independent of goal order. Slots the player has
already applied SHALL NOT count as overlap. A goal without a range (or, for a Machine of War,
without a range on a track) SHALL be additive for that scope.

Assumptions:

- A Character rank slot at rank R is the upgrade applied while at R to reach the next rank
  (`rankUpUpgrades`).
- A Machine of War level n→n+1 uses recipe row n−1 of its track, as `mowAbilityUpgradeIds` does.
- Owned inventory is 0 in the examples so only slot overlap is shown.

#### Scenario: Character overlap, Rank goal first (worked example)

- **GIVEN** `ultraApothecary` (Incisus), whose Stone1 and Stone2 rank-up rows each contain one
  `upgArmC002` and whose Stone3 row contains none; an Active Rank goal Stone1→Stone3 (priority 1)
  and an Active Upgrade goal with `rankRange` Stone2→Stone4 targeting `upgArmC002` × 5 (priority 2)
- **WHEN** the plan is calculated
- **THEN** the Rank goal charges 2 `upgArmC002` (Stone1 slot, Stone2 slot); the Upgrade goal's
  range holds 1 `upgArmC002` slot (Stone2), already claimed, so its need is 5 − min(5, 1) = 4;
  total 6, not 7

#### Scenario: Same goals, Upgrade goal first

- **GIVEN** the same goals with the Upgrade goal at priority 1
- **WHEN** the plan is calculated
- **THEN** the Upgrade goal needs 5 and claims 1 slot (Stone2); the Rank goal charges only its
  uncovered Stone1 slot = 1; total 6 — the same as when the Rank goal runs first

#### Scenario: Deduction is capped at the Upgrade quantity

- **GIVEN** a Rank goal Stone1→Stone3 (priority 1) and an Upgrade goal with `rankRange`
  Stone1→Stone3 targeting `upgArmC002` × 1 (priority 2); the range holds 2 `upgArmC002` slots
- **WHEN** the plan is calculated
- **THEN** the overlap is 2 but the deduction is capped at 1, so the Upgrade need is 0 and the
  total is 2 (the Rank goal's own charge)

#### Scenario: Machine of War overlap per track

- **GIVEN** `astraOrdnanceBattery` whose primary recipe rows 0 and 3 each contain `upgDmgC002`
  and rows 1 and 2 contain none; an Ability goal primary 1→3 (rows 0–1, priority 1) and an Upgrade
  goal with `activeRange` 1→5 (rows 0–3) targeting `upgDmgC002` × 3 (priority 2)
- **WHEN** the plan is calculated
- **THEN** the Ability goal charges 1 `upgDmgC002` (row 0); the Upgrade goal overlaps 1 slot, so
  its need is 3 − 1 = 2; total 3, not 4

#### Scenario: No range is additive

- **GIVEN** a Rank goal charging 2 `upgArmC002` and an Upgrade goal with no range targeting
  `upgArmC002` × 5
- **WHEN** the plan is calculated
- **THEN** the demand is 2 + 5 = 7, with owned inventory netted by priority afterwards
